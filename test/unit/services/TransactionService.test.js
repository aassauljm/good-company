var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var moment = require('moment');



describe('Transaction Service, inverse transactions', function() {
    var rootState, initialState = {
        companyName: 'dingbat limited',
        addressForService: 'china',
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


    describe('Change name transaction', function() {
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
            var prevState;
            return rootState.buildPrevious()
                .then(function(companyState){
                    prevState = companyState;
                    return TransactionService.performInverseNameChange({
                        transactionType: Transaction.types.NAME_CHANGE,
                        newCompanyName: 'dingbat limited',
                        previousCompanyName: 'dingbat unlimited'
                    }, companyState, rootState).should.eventually.be.fulfilled;
                })
                .then(function(transaction){
                    transaction.type.should.be.equal(Transaction.types.NAME_CHANGE);
                    prevState.companyName.should.be.equal('dingbat unlimited');
                })
        });
    });

    describe('Change address transaction', function() {
        it('renames company, fail validation (wrong current address)', function() {
            return rootState.buildPrevious()
                .then(function(companyState){
                    return TransactionService.performInverseAddressChange({
                        transactionType: Transaction.types.NAME_CHANGE,
                        oldAddress: 'japan',
                        newAddress: 'chinatown',
                        field: 'addressForService',
                    }, companyState, rootState).should.eventually.be.rejected;
                })
        });
        it('renames company, fail validation, success', function() {
            var prevState;
            return rootState.buildPrevious()
                .then(function(companyState){
                    prevState = companyState;
                    return TransactionService.performInverseAddressChange({
                        transactionType: Transaction.types.NAME_CHANGE,
                        previousAddress: 'japan',
                        newAddress: 'china',
                        field: 'addressForService',
                    }, companyState, rootState).should.eventually.be.fulfilled;
                })
                .then(function(){
                    prevState.addressForService.should.be.equal('japan');
                })
        });
    });

});