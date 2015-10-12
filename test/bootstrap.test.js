var Sails = require('sails');
var Promise = require("bluebird");
var Barrels = require("barrels");
var fs = Promise.promisifyAll(require("fs"));
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
chai.should();
var sails;


before(function(done) {

    Sails.lift({
        port: 1338,
        log: {
            level: 'info'
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
             permissions: false
        },
        babel: {stage: 0},
        test: true
    }, function(err, server) {
        if (err) return done(err);
        sails = server;
        sails.log.info('Sails Lifted');

        var barrels = new Barrels();
        // Populate the DB
        barrels.populate(['user'], function(err) {
            if (err)
                return done(err); // Higher level callback

            // Users will already be populated here, so the required association should work
            barrels.populate(['passport'], function(err) {
                if (err)
                    return done(err); // Higher level callback

                // Do your thing...
                done();
            },false);
        });
    });
});

after(function(done) {
    console.log(); // Skip a line before displaying Sails lowering logs
    sails.lower(done);
});