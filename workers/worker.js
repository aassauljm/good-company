"use strict";
var Sails = require('sails').constructor;
var kue = require('kue');
var sails = new Sails();
var queue = kue.createQueue();
var Promise = require('bluebird');

process.once( 'SIGTERM', function ( sig ) {
  queue.shutdown( 5000, function(err) {
    console.log( 'Kue shutdown: ', err||'' );
    process.exit( 0 );
  });
});

var getNamespace = require('continuation-local-storage').getNamespace;
//var patchBluebird = require('cls-bluebird');
var Promise = require('bluebird'),
    shimmer = require('shimmer');
var fs = Promise.promisifyAll(require('fs'));

// functionName: The Promise function that should be shimmed
// fnArgs: The arguments index that should be CLS enabled (typically all callbacks). Offset from last if negative

function patchBluebird(ns) {
    function shimCLS(object, functionName, fnArgs) {
        shimmer.wrap(object, functionName, function(fn) {
            return function() {
                for (var x = 0; x < fnArgs.length; x++) {
                    var argIndex = fnArgs[x] < 0 ? arguments.length + fnArgs[x] : fnArgs[x];
                    if (argIndex < arguments.length && typeof arguments[argIndex] === 'function') {
                        arguments[argIndex] = ns.bind(arguments[argIndex]);
                    }
                }
                return fn.apply(this, arguments);
            };
        });
    }

    // Core
    shimCLS(Promise, 'join', [-1]);
    shimCLS(Promise.prototype, 'then', [0, 1, 2]);
    shimCLS(Promise.prototype, 'spread', [0, 1]);
    shimCLS(Promise.prototype, 'catch', [-1]);
    shimCLS(Promise.prototype, 'error', [0]);
    shimCLS(Promise.prototype, 'finally', [0]);

    // Collections
    shimCLS(Promise, 'map', [1]);
    shimCLS(Promise, 'reduce', [1]);
    shimCLS(Promise, 'filter', [1]);
    shimCLS(Promise, 'each', [1]);
    shimCLS(Promise.prototype, 'map', [0]);
    shimCLS(Promise.prototype, 'reduce', [0]);
    shimCLS(Promise.prototype, 'filter', [0]);
    shimCLS(Promise.prototype, 'each', [0]);

    // Promisification
    shimCLS(Promise.prototype, 'nodeify', [0]);

    // Utility
    shimCLS(Promise.prototype, 'tap', [0]);

    // Error management configuration
    shimCLS(Promise.prototype, 'done', [0, 1]);
    console.log('SHIMMED CLS')
}




sails.load({
    log: {
        level: 'verbose'
    },
    models: {
        migrate: 'safe'
    },
    hooks: {
        blueprints: false,
        fixtures: false,
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
}, function(err){
    sails.log.info('Worker Ready');
    if(err){
        sails.log.error('Worker Error');
        return;
    };
    var namespace = getNamespace('sails-sequelize-postgresql');
    patchBluebird(namespace);

    queue.process('import', 10, function(job, done){
        sails.log.info('Receiving Job: '+JSON.stringify(job.data));
        const userId = job.data.userId;
        let company;

        function deleteCompany(){
            return (company ? company.destroy() : Promise.resolve())
        }

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
                sails.log.error(e);
                return ActivityLog.create({
                    type: ActivityLog.types.IMPORT_COMPANY_FAIL,
                    userId: userId,
                    description: `Company has already been imported: ${job.data.query}`,
                    data: {}
                })
                .then(function(){
                    return deleteCompany();
                })
                .then(function(){
                    return done(new Error('Duplicate name: '+job.data.query));
                });
            })
            .catch(sails.config.exceptions.ValidationException, function(e){
                sails.log.error(e);
                return ActivityLog.create({
                    type: ActivityLog.types.IMPORT_COMPANY_FAIL,
                    userId: userId,
                    description: `${e.message}: ${job.data.query}`,
                    data: {}
                })
                .then(function(){
                    return deleteCompany();
                })
                .then(function(){
                    return done(new Error(`${e.message}: ${job.data.query}`));
                });
            })
            .catch(function(e) {
                sails.log.error(e);
                return ActivityLog.create({
                    type: ActivityLog.types.IMPORT_COMPANY_FAIL,
                    userId: userId,
                    description: `Could not find company with identifier: ${job.data.query}`,
                    data: {}
                })
                .then(function(){
                    return deleteCompany();
                })
                .then(function(){
                    return done(new Error('Could not find company: '+job.data.query));
                });
            })
            .then(function(){
                return job.remove();
            });
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
        .then(function(){
            return job.remove();
        });
    });


    function createThenApplyShareClassAllHoldings(company, companyId, companyName, userId, data){
        console.log(data)
        return sails.controllers.companystate.selfManagedTransactions.createThenApplyShareClassAllHoldings(data, company)
            .then((result) => ActivityLog.create({
                userId: userId,
                description: result.message,
                companyId: companyId,
                data: {companyId: companyId}
            }))
            .catch(e => {
                return ActivityLog.create({
                    userId: userId,
                    companyId: companyId,
                    description: `Failed to create and apply share classes for ${companyName}`,
                    data: {companyId: companyId}
                })
                .then(() => {
                    throw e;
                })
            });
    }


    function importHistory(company, companyId, companyName, userId){
        return TransactionService.performInverseAllPending(company)
            .then(() => ActivityLog.create({
                type: ActivityLog.types.COMPLETE_IMPORT_HISTORY,
                userId: userId,
                description: `Complete ${companyName} History Import`,
                companyId: companyId,
                data: {companyId: companyId}
            }))
            .catch(e => {
                return ActivityLog.create({
                    type: ActivityLog.types.IMPORT_HISTORY_FAIL,
                    userId: userId,
                    description: `Failed to complete ${companyName} History Import`,
                    companyId: companyId,
                    data: {companyId: companyId}
                })
                .then(e => {
                    throw e;
                })
            });
    }

    queue.process('transactions', function(job, done) {
        sails.log.info('Receiving Job: '+JSON.stringify(job.data));
        let companyName, company;
        return Company.findById(job.data.companyId)
            .then(function(_company){
                company  = _company;
                return company.getCurrentCompanyState()
            })
            .then(_state => {
                companyName = _state.get('companyName');
                return Promise.reduce(job.data.transactions, function(arr, transaction){
                    switch(transaction.transactionType){
                        case(sails.config.enums.CREATE_APPLY_ALL_SHARE_CLASS):
                            return createThenApplyShareClassAllHoldings(company, job.data.companyId, companyName, job.data.userId, transaction.data);
                        case(sails.config.enums.IMPORT_HISTORY):
                            return importHistory(company, job.data.companyId, companyName, job.data.userId);
                    }
                }, []);
            })
            .then(() => {
                return done();
            })
            .catch(e => {
                sails.log.error('Failed transactions', e.message);
                return done(new Error(`Failed to complete ${companyName} Transactions`));
            })
            .then(() => {
                return job.remove();
            });

        });

});