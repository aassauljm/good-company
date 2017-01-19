require("babel-polyfill");
var jsdom = require('jsdom');
dom();
var _ = require('lodash');``
var Sails = require('sails');
var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var chai = require("chai");
var sequelize_fixtures = require('sequelize-fixtures');
var chaiAsPromised = require("chai-as-promised");
var chaiSubset = require('chai-subset');
chai.use(chaiAsPromised);
chai.use(chaiSubset);
chai.should();
var events = require("events"),
EventEmitter = events.EventEmitter;
EventEmitter.defaultMaxListeners = 30;
Error.stackTraceLimit = Infinity;
var setFetch = require("../assets/js/utils").setFetch;
var _fetch = require('isomorphic-fetch');
var nodemailer = require('nodemailer');
var stubTransport = require('nodemailer-stub-transport');
var sails;

function stubs(){

    ScrapingService.fetch = function(companyNumber){
        return fs.readFileAsync('test/fixtures/companies_office/'+companyNumber+'.html', 'utf8');
    }

    ScrapingService.fetchDocument = function(companyNumber, documentId){
        return fs.readFileAsync('test/fixtures/companies_office/documents/'+documentId+'.html', 'utf8')
            .then(function(text){
                return {text: text, documentId: documentId}
            });
    }

    ScrapingService.fetchSearchResults = function(query){
        return fs.readFileAsync('test/fixtures/companies_office/queries/'+query+'.html', 'utf8')
    }

    ScrapingService.getDocumentSummaries = function(data){
        return Promise.map(data.documents, function(document){
            return ScrapingService.fetchDocument(data.companyNumber, document.documentId);
        }, {concurrency: 5});
    }

    MailService.getTransport = function(){
        return nodemailer.createTransport(stubTransport());
    }

    CompanyInfoService.fetchNameHistory = function(companies) {
        const data = [{
            'ACUMEN CONSULTING LIMITED': {
                'nzbn': '9429033966649',
                 companyNumber: '1846929',
                 queryName: 'ACUMEN CONSULTING LIMITED',
                 history: [{name: 'ACUMEN CONSULTING LIMITED', startDate: '26 Feb 2010'}, {name: 'CAD ADVANCED SOLUTIONS LIMITED', startDate:'02 Aug 2006', endDate: '26 Feb 2010'}]
            }
        }];
        const results = [];
        companies.map(c => {
            data.map(d => {
                if(d[c.name]){
                    results.push(d[c.name]);
                }
            })
        })
        return Promise.resolve(results);
    }



    var cookie;
    // This function will allow cookie authentication to persist on the server side
    setFetch(function(url, args){
        url =  window.location.protocol + '//' +window.location.host + url;
        return _fetch(url, _.merge(args, {headers: _.merge(args.headers, {'Cookie': cookie})}))
            .then(function(r){
                if(r.headers._headers['set-cookie']){
                    cookie = r.headers._headers['set-cookie'][0];
                }
                return r;
            })
    })
    global.__DEV__ = false;
}

function addMigrations(){
    return fs.readdirAsync(__dirname + '/../migrations')
        .then(function(files){
            return Migrations.bulkCreate(files.map(function(f){ return {name: f}}));
        })
}


function dom(){
    global.__DEV__ = false;
    global.__SERVER__ = true;
    global.document = jsdom.jsdom('<!doctype html><html><body><div id="main"></div></body></html>', {url: 'http://localhost:1338/'});
    global.window = document.defaultView;
    propagateToGlobal(global.window)

    // from mocha-jsdom https://github.com/rstacruz/mocha-jsdom/blob/master/index.js#L80
    function propagateToGlobal (window) {
      for (let key in window) {
        if (!window.hasOwnProperty(key)) continue
        if (key in global) continue

        global[key] = window[key]
      }
    }
}


function lift(cb){
    Sails.lift({
        port: 1338,
        serverRender: true,
        log: {
            level: 'error'
        },
        models: {
            connection: 'pg_test',
            migrate: 'drop'
        },
        fixtures: false,
        hooks:{
            orm: false,
            blueprints: false,
            grunt: false,
            sockets: false,
            pubsub: false,
            permissions: false,
        },
        passport: {
            local: true,
        },
        session: {adapter: 'memory'},
        test: true,
        renderServiceUrl: 'localhost:5668',
        CACHE_DIR: '/tmp/.gc_test',
        IMPORT_EXTENSIVE: true
    }, cb);
}

before(function(done) {
    if(!process.env.SKIP_SAILS){
        lift(function(err, server) {
            if (err) return done(err);
            sails = server;
            sails.log.info('Sails Lifted');
            sequelize_fixtures.loadFiles([
                 'test/fixtures/user.json',
                 'test/fixtures/passport.json',
                 'test/fixtures/shareClass.json',
                 'test/fixtures/companyState.json',
                 'test/fixtures/company.json',
                 ], sails.models)
                .then(addMigrations)
                .then(function(){
                    fs.readFileAsync('config/db/functions.sql', 'utf8')
                    .then(function(sql){
                        return sequelize.query(sql)
                    })
                    .then(function(){
                        return sequelize.query('SELECT reset_sequences();')
                    })
                    .then(function(){
                        stubs();
                        done();
                    });
                });
            });
    }
    else{
        global.sails = {
            log: {
                verbose: function(){},
                silly: function(){},
                error: console.log,
                info: console.log,
            }
        }
        console.log('Skipping sails lift');
        done();
    }
});

after(function(done) {
    console.log(); // Skip a line before displaying Sails lowering logs
    if(!process.env.SKIP_SAILS){
        sails.lower(done);
    }
    else{
        done();
    }
});
