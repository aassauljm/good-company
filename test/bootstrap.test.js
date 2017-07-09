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
var events = require("events");
events.EventEmitter.prototype._maxListeners = 40;
Error.stackTraceLimit = Infinity;
var Utils = require("../assets/js/utils");
var _fetch = require('isomorphic-fetch');
var nodemailer = require('nodemailer');
var stubTransport = require('nodemailer-stub-transport');
var LawBrowserContainer = require('../assets/js/components/lawBrowserContainer');

var sails;

var queryGen = require('sequelize/lib/dialects/postgres/query-generator');

queryGen.pgEnumDrop =  function(tableName, attr, enumName) {
    enumName = enumName || this.pgEnumName(tableName, attr);
    return 'DROP TYPE IF EXISTS ' + enumName + ' CASCADE;';
}



function stubs(){
    // lawbrowser links screw up in the testing tree
    LawBrowserContainer.default.prototype.forceNoLawLinks = true;

    ScrapingService._testPath = 'test/fixtures/companies_office/';

    ScrapingService.fetch = function(companyNumber) {
        return fs.readFileAsync(ScrapingService._testPath +companyNumber+'.html', 'utf8');
    }

    ScrapingService.fetchDocument = function(companyNumber, documentId) {
        return fs.readFileAsync(ScrapingService._testPath + 'documents/'+documentId+'.html', 'utf8')
            .then(function(text){
                return {text: text, documentId: documentId}
            });
    }

    ScrapingService.fetchSearchResults = function(query) {
        return fs.readFileAsync('test/fixtures/companies_office/queries/'+query+'.html', 'utf8')
    }

    ScrapingService.getDocumentSummaries = function(data) {
        return Promise.map(data.documents, function(document){
            return ScrapingService.fetchDocument(data.companyNumber, document.documentId);
        }, {concurrency: 5});
    }

    MbieSyncService.fetchState = function(user, company, state) {
        const nzbn = state.nzbn;
        const basePath = `test/fixtures/companies_office/api/${nzbn}/`;
        const general = fs.readFileAsync(`${basePath}general.json`, 'utf8');
        const directors = fs.readFileAsync(`${basePath}directors.json`, 'utf8');
        const shareholdings = fs.readFileAsync(`${basePath}shareholdings.json`, 'utf8');
        return Promise.all([general, directors, shareholdings])
            .map(JSON.parse)
            .spread((general, directors, shareholdings) => {
                return {general, directors, shareholdings}
            })
    }

    MbieApiService.requestOauthToken = function(url, consumerKey, consumerSecret) {
        return new Promise((resolve, reject) => {
            let response;

            if (url.includes('error')) {
                response = {
                    error: 'error!',
                    description: 'An error has occured :('
                };
            }
            else {
                response = {
                    access_token: 'access_token_random_string',
                    token_type: 'bearer',
                    refresh_token: 'refresh_token_random_string',
                    expires_in: 3600,
                    scope: 'SCOPE_ONE SCOPE_TWO'
                };
            }

            resolve(response);
        });
    }


    MailService.getTransport = function(){
        return nodemailer.createTransport(stubTransport());
    }
    MailService.sendCataLexMail = function() {
        return Promise.resolve({})
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
    Utils.setFetch(function(url, args){
        url =  window.location.protocol + '//' +window.location.host + url;
        return _fetch(url, _.merge(args, {headers: _.merge({}, args.headers, {'Cookie': cookie})}))
            .then(function(r){
                if(r.headers._headers['set-cookie']){
                    cookie = r.headers._headers['set-cookie'][0];
                }
                return r;
            })
    })


    sails.controllers.render.renderTemplate = function(req, res){
        return fs.readFileAsync('test/fixtures/companies.json')
            .then(d => {
                res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
                res.set('Content-Disposition', 'attachment; filename=1.docx');
                res.send(d);
            })
    };



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
        environment: 'test',
        serverRender: true,
        log: {
            level: process.env.LOG || 'silent'
        },
        models: {
            connection: 'pg_test',
            migrate: 'drop'
        },
        fixtures: !process.env.SKIP_SAILS,
        hooks:{
            orm: false,
            blueprints: false,
            grunt: false,
            sockets: false,
            pubsub: false,
            permissions: false,
        },
        APP_URL: '',
        session: {adapter: 'memory'},
        test: true,
        renderServiceUrl: 'localhost:5668',
        CACHE_DIR: '/tmp/.gc_test',
        IMPORT_EXTENSIVE: true,
        ADMIN_KEY: 'test',
        csrf: false,
        mbie: {
            nzbn: {oauth: {url: 'http://xxx.nzbn'}},
            companiesOffice: {oauth: {url: 'http://xxx.companiesOffice'}}
        }
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
                 'test/fixtures/organisation.json',
                 'test/fixtures/apiCredentials.json'
                 ], sails.models, {log: sails.log.info})
                .tap(() => {
                    sails.log.info('Fixtures loaded')
                })
                .then(addMigrations)
                .then(function(){
                    return sequelize.query('SELECT reset_sequences();')
                })
                .tap(() => {
                    sails.log.info('Migrations complete')
                })
                .then(function(){
                    stubs();
                    done();
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
        sails.log.info('Skipping sails lift');
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
