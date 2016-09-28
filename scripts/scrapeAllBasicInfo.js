"use strict";
require("babel-core/register");
var moment = require('moment');
var cheerio = require('cheerio');
var Promise = require("bluebird");
var pgp = require('pg-promise')();

global.sails = {
    log: {
        verbose: console.log,
        silly: console.log,
        error: console.log,
        info: console.log,
    },
    config: {}
}

const ScrapingService = require('../api/services/ScrapingService');

function dateToString(date){
    return date.format('DD/MM/YYYY')
}

var startDate = moment({ years:1900, months:1, day: 1});
var endDate = moment({ years:1910, months:1, day: 1});

var MAX = 200;
var SLEEP = 5000;
var config = {
    database: 'companies_office_data'
}
var db = pgp(config);

var args = {
    q: '',
    //entityTypes: ['LTD', 'UNLTD', 'COOP'],
    entityTypes: ['ASIC', 'NON_ASIC'],
    entityStatusGroups: 'REGISTERED',
    address: 'ALL',
    start: 0,
    limit: 200,
    advancedPanel: true,
    mode: 'advanced'
}

function sleep(timeout) {
    return new Promise(function(resolve) {
        setTimeout(resolve, timeout);
    });
}

const entityInfoRegex = /\((\d+)\) \(NZBN: (\d+)\)/;

var cs = new pgp.helpers.ColumnSet(['companyName', 'companyNumber', 'nzbn', 'incorporationDate'], {table: 'company_basic_info'});

function loop(){
    ScrapingService.fetchSearchResults(args)
        .then(function(text){
          var $ = cheerio.load(text);
          var results = $('.dataList tbody tr').map(function(i, el){
            var info = $(el).find('.entityInfo').text();
            var dateString = $(el).find('.incorporationDate label').text();
            var matches = entityInfoRegex.exec(info);
            return {
                companyName: $(el).find('.entityName').text(),
                companyNumber: matches[1],
                nzbn: matches[2],
                incorporationDate: moment(dateString, 'DD MMM YYYY').toDate()
            }
            }).toArray();
            var total = parseInt($('.totalInfo h4').text().split(/\s+/)[5]);
            console.log(args.incorpFrom, args.incorpTo, total)
            /*if(!total){
                return widenQuery();
            }
            if(total > MAX && args.incorpTo !== args.incorpFrom){
                // too bad
                return refineQuery();
            }*/

            if(!total || !results.length){
                return nextQuery();
            }
            var query = pgp.helpers.insert(results, cs);
            return db.none(query)
                .then(() => {
                    return nextQuery();
                })
        })
        .then(function(){
            if(startDate.isAfter(new Date())){
                throw new Error('all done')
            }
            return sleep(SLEEP);
        })
        .then(function(){
            return loop();
        })
        .catch((e) => {
            console.log('error', e)
        })
};

var diff = 0
function nextQuery(){
    console.log('next query')
    startDate = endDate.clone();
    //startDate = startDate.clone().add(1, 'days');

    if(!diff){
        endDate = endDate.clone().add(10, 'year');
    }
    else{
        endDate = endDate.clone().add(diff, 'milliseconds');
    }
    /*
    if(args.incorpTo === args.incorpFrom){
        console.log('same day')
        startDate = startDate.clone().add('1', 'days');
        endDate = endDate.clone().add('2', 'days');
    }*/
    //startDate = endDate.clone().add('1', 'days');
    //endDate = startDate;

     applyDates();
}

function refineQuery(){
    console.log('refine')
     if(args.incorpTo === args.incorpFrom){
        //throw new Error('too many!')

     }
    // half the query distance
    diff = endDate.clone().diff(startDate)/2;
    endDate = startDate.clone().add(diff, 'milliseconds')
    applyDates();
}

function widenQuery(){
    console.log('widen')
    startDate = endDate;
    endDate =  endDate.clone().add(2, 'days');
    applyDates();
}

function applyDates(){
     args.incorpFrom = dateToString(startDate);
     args.incorpTo = dateToString(endDate);
     if(args.incorpTo === args.incorpFrom){
        //throw new Error('too many!')
     }
}

applyDates();
loop();