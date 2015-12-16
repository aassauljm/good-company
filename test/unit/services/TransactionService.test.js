var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var moment = require('moment');



describe('Transaction Service', function() {
    var rootState, initialState = {
        companyName: 'dingbat limited',
        holdings: [{
            holders: [{
                name: 'mike'
            }],
            parcels: [{
                amount: 1
            }]
        }]
    };

    before(function(){
        return CompanyState.createDedupPersons(initialState)
            .then(function(_companyState){
                rootState = _companyState
            })
    })


    describe('Set up companystate and apply inverse transactions', function() {
        it('renames company, fail validation (wrong current name)', function() {
            return rootState.buildPrevious()
                .then(function(companyState){
                    return TransactionService.performInverseNameChange({
                        transactionType: Transaction.types.NAME_CHANGE,
                        previousCompanyName: 'x',
                        newCompanyName: 'x',
                    }, companyState, rootState).should.eventually.be.rejected;
                })
        });
        it('renames company, fail validation (empty previous name)', function() {
            return rootState.buildPrevious()
                .then(function(companyState){
                    return TransactionService.performInverseNameChange({
                        transactionType: Transaction.types.NAME_CHANGE,
                        newCompanyName: 'dingbat limited',
                    }, companyState, rootState).should.eventually.be.rejected;
                });
        });
        it('renames company, fail validation (same name)', function() {
            return rootState.buildPrevious()
                .then(function(companyState){
                    return TransactionService.performInverseNameChange({
                        transactionType: Transaction.types.NAME_CHANGE,
                        newCompanyName: 'dingbat limited',
                        previousCompanyName: 'dingbat limited'
                    }, companyState, rootState).should.eventually.be.rejected;
                });
        });
        it('renames company, success', function() {
            let prevState;
            return rootState.buildPrevious()
                .then(function(companyState){
                    prevState = companyState;
                    return TransactionService.performInverseNameChange({
                        transactionType: Transaction.types.NAME_CHANGE,
                        newCompanyName: 'dingbat limited',
                        previousCompanyName: 'dingbat unlimited'
                    }, companyState, rootState).should.eventually.be.fulfilled;
                })
                .then(function(){
                    prevState.companyName.should.be.equal('dingbat unlimited');
                })
        });
    });

});