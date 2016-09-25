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



var SLEEP = 1;
var config = {
    database: 'companies_office_data'
}
var db = pgp(config);

function sleep(timeout) {
    return new Promise(function(resolve) {
        setTimeout(resolve, timeout);
    });
}

const entityInfoRegex = /\((\d+)\) \(NZBN: (\d+)\)/;

var cs = new pgp.helpers.ColumnSet(['companyName', 'companyNumber', 'nzbn', 'incorporationDate'], {table: 'company_basic_info'});

var offset = 0;

function getNext() {
    console.log('index', offset)
    return db.one('select "companyNumber" from company_basic_info  where data is null order by "companyNumber" desc limit 1 offset ${offset}', {offset: offset++});
}




function getData(){
    var companyNumber
    getNext()
    .then(function(result){
        companyNumber = result.companyNumber;
        return ScrapingService.fetch(companyNumber)
    })
    .then(ScrapingService.parseNZCompaniesOffice)
    .then(function(data){
        return db.none('update company_basic_info set data = ${data} where "companyNumber" = ${companyNumber}', {
            data: data, companyNumber: companyNumber
        })
    })
    .then(function(){
        return sleep(SLEEP);
    })
    .then(function(){
        return getData();
    })
    .catch(function(e){
        console.log(e);
        return getData();
    })
};

getData();