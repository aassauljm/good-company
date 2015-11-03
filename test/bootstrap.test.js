var jsdom = require('node-jsdom');
var https = require('https');
var _ = require('lodash');
dom();

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
require("babel/register")({stage: 0});
var setFetch = require("../assets/js/utils").setFetch;
var _fetch = require('isomorphic-fetch');

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
    var cookie;
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
}

function dom(){
    global.__DEV__ = process.env.NODE_ENV !== 'production';

    // setup the simplest document possible
    var doc = jsdom.jsdom('<!doctype html><html><body><div id="main"></div></body></html>', {url: 'http://localhost:1338/'});
    // get the window object out of the document
    var win = doc.defaultView;
    // set globals for mocha that make access to document and window feel
    // natural in the test environment
    global.document = doc;
    global.window = win;

    // take all properties of the window object and also attach it to the
    // mocha global object
    propagateToGlobal(win);
    // from mocha-jsdom https://github.com/rstacruz/mocha-jsdom/blob/master/index.js#L80
    function propagateToGlobal (window) {
      for (var key in window) {
        if (!window.hasOwnProperty(key)) continue
        if (key in global) continue
        global[key] = window[key]
      }
    }
}


before(function(done) {
    console.log(__dirname)
    Sails.lift({
        port: 1338,
        log: {
            level: 'error'
        },
        models: {
            connection: 'pg_test',
            migrate: 'drop'
        },
        hooks:{
            orm: false,
            blueprints: false,
            grunt: false,
            sockets: false,
            pubsub: false,
            permissions: false,
        },
        babel: {stage: 0, compile: false},
        test: true
    }, function(err, server) {
        if (err) return done(err);
        sails = server;
        sails.log.info('Sails Lifted');
        sequelize_fixtures.loadFiles(['test/fixtures/user.json',
                                     'test/fixtures/passport.json',
                                     'test/fixtures/companyState.json',
                                     'test/fixtures/company.json'], sails.models)
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
});

after(function(done) {
    console.log(); // Skip a line before displaying Sails lowering logs
    sails.lower(done);
});