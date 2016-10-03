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
        orm: false,
        userPermissions: false,
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
    sails.log.info('Worker Ready');
    if(err){
        sails.log.error('Worker Error');
        return;
    };

    queue.process('import', function(job, done){
        sails.log.info('Receiving Job: '+JSON.stringify(job.data));
        const userId = job.data.userId;
        let company;

        function deleteCompany(){
            return (company ? company.destroy() : Promise.resolve())
        })

        function getNumber() {
            let companyNumber;
            if(job.data.queryType !== 'companyNumber'){
                return ScrapingService.cleanUpQuery(job.data.query)
                    .then(ScrapingService.getSearchResults)
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
            .then(function(_company) {
                company = _company;
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
                    deleteCompany();
                    return done(new Error('Duplicate name: '+job.data.query));
                });
            })
            .catch(sails.config.exceptions.ValidationException, function(e){
                return ActivityLog.create({
                    type: ActivityLog.types.IMPORT_COMPANY_FAIL,
                    userId: userId,
                    description: `${e.message}: ${job.data.query}`,
                    data: {}
                })
                .then(function(){
                    deleteCompany();
                    return done(new Error(`${e.message}: ${job.data.query}`));
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
                    deleteCompany();
                    return done(new Error('Could not find company: '+job.data.query));
                });
            })
            .then(function(){
                return job.remove();
            })
    });


    queue.process('history', function(job, done) {
        let company, companyName;
        Company.findById(job.data.companyId)
        .then(function(_company){
            company  = _company;
            return company.getCurrentCompanyState()
        })
        .then(_state => {
            companyName = _state.get('companyName');
            return TransactionService.performInverseAllPending(company);
        })
        .then(() => {
            return ActivityLog.create({
                type: ActivityLog.types.COMPLETE_IMPORT_HISTORY,
                userId: job.data.userId,
                description: `Complete ${companyName} History Import`,
                data: {companyId: job.data.companyId}
            });
        })
        .then(function() {
            return done();
        })
        .catch(function(e){
            return ActivityLog.create({
                type: ActivityLog.types.IMPORT_HISTORY_FAIL,
                userId: job.data.userId,
                description: `Failed to complete ${companyName} History Import`,
                data: {companyId: job.data.companyId}
            })
            .then(function(){
                return done(new Error(`Failed to complete ${companyName} History Import`));
            });
        })
    })

});