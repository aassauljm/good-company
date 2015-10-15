var superstack = require('superstack');
var Sails = require('sails');
var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var chai = require("chai");
var sequelize_fixtures = require('sequelize-fixtures');
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
chai.should();
var events = require("events"),
    EventEmitter = events.EventEmitter;
EventEmitter.defaultMaxListeners = 20;
Error.stackTraceLimit = Infinity;
var sails;

//EventEmitter.emitter.setMaxListeners(20)

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
        sequelize_fixtures.loadFiles(['test/fixtures/user.json', 'test/fixtures/passport.json'], sails.models)
            .then(function(){
                done();
            });
    });
});

after(function(done) {
    console.log(); // Skip a line before displaying Sails lowering logs
    sails.lower(done);
});