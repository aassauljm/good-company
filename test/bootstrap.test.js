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
EventEmitter.defaultMaxListeners = 20;
Error.stackTraceLimit = Infinity;
var sails;

function stubs(){
    ScrapingService.fetch = function(companyNumber){
        return fs.readFileAsync('test/fixtures/companies_office/'+companyNumber+'.html', 'utf8');
    }
    ScrapingService.fetchDocument = function(companyNumber, documentId){
        return fs.readFileAsync('test/fixtures/companies_office/documents/'+documentId+'.html', 'utf8')
            .then(function(text){
                return {text: text, documentId: documentId}
            })
    }
}




before(function(done) {
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
        babel: {stage: 0},
        test: true
    }, function(err, server) {
        if (err) return done(err);
        sails = server;
        sails.log.info('Sails Lifted');
        sequelize_fixtures.loadFiles(['test/fixtures/user.json', 'test/fixtures/passport.json', 'test/fixtures/company.json'], sails.models)
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