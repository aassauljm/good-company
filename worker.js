"use strict";
var Sails = require('sails').constructor;
var kue = require('kue');
var app = new Sails();
var queue = kue.createQueue();
var Promise = require('bluebird');


app.load({
        log: {
            level: 'silly'
        },
    models: {
        migrate: 'safe'
    },
    hooks: {
        blueprints: false,
        controllers: false,
        cors: false,
        csrf: false,
        grunt: false,
        http: false,
        i18n: false,
        "orm": false,
        "userPermissions": false,
        //logger: false,
        policies: false,
        pubsub: false,
        request: false,
        responses: false,
        //services: leave default hook,
        session: false,
        sockets: false,
        views: false
    }
}, function(err, app){
    if(err){
        console.log(err);
        return;
    };

    queue.process('import', function(job, done){
        const userId = job.data.userId;
        let companyNumber;
        if(job.data.queryType !== 'companyNumber'){
            companyNumber = ScrapingService.getSearchResults(job.data.query)
                .then(function(results) {
                    return results[0].companyNumber
                });
        }
        else{
            companyNumber = Promise.resolve(job.data.query);
        }

        companyNumber.then(function(companyNumber) {
            return ImportService.importCompany(companyNumber, {
                history: true,
                userId: job.data.userId
            })
        })
        .then(function() {
            done();
        })
        .catch(function(e) {
            console.log(e)
            return done(new Error('Could not find company: '+job.data.query));
        })

    });

});