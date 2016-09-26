"use strict";
var Sails = require('sails').constructor;
var kue = require('kue');
var app = new Sails();
var queue = kue.createQueue();
var Promise = require('bluebird');


app.load({
        log: {
            level: 'info'
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
        function getNumber() {
            let companyNumber;
            if(job.data.queryType !== 'companyNumber'){
                return ScrapingService.getSearchResults(job.data.query)
                    .then(function(results) {
                        return results[0].companyNumber
                    });
            }
            else{
                return job.data.query;
            }
        }
        Promise.resolve(getNumber())
            .then(function(companyNumber) {
                return ImportService.importCompany(companyNumber, {
                    history: true,
                    userId: job.data.userId
                })
            })
            .then(function() {
                return done();
            })
            .catch(sails.config.exceptions.NameExistsException, function(e){
                return ActivityLog.create({
                    type: ActivityLog.types.IMPORT_COMPANY_FAIL,
                    userId: userId,
                    description: `Company has already been imported: ${job.data.query}`,
                    data: {}
                })
                .then(function(){
                    return done(new Error('Duplicate name: '+job.data.query));
                });
            })
            .catch(function(e) {
                return ActivityLog.create({
                    type: ActivityLog.types.IMPORT_COMPANY_FAIL,
                    userId: userId,
                    description: `Could not find company with identifier: ${job.data.query}`,
                    data: {}
                })
                .then(function(){
                    return done(new Error('Could not find company: '+job.data.query));
                });
            })
            .then(function(){
                return job.remove();
            })
    })

});