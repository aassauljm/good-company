var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var moment = require('moment');
import chai from 'chai';
const should = chai.should();


describe('Transaction Service, inverse transactions', function() {
    var rootStateSimple, initialStateSimple = {
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
    }, rootStateMultiple, initialStateMultiple = {
        companyName: 'multiplex',
        holdings: [{
            holders: [{
                name: 'mike'
            }],
            parcels: [{
                amount: 1
            }]
        },{
            holders: [{
                name: 'mike'
            },{
                name: 'john'
            }],
            parcels: [{
                amount: 2
            }]
        },{
            holders: [{
                name: 'mike'
            },{
                name: 'mary'
            }],
            parcels: [{
                amount: 3
            }]
        },{
            holders: [{
                name: 'mike'
            }],
            parcels: [{
                amount: 1
            }]
        }]
    };

    before(function(){
        return CompanyState.createDedupPersons(initialStateSimple)
            .then(function(_companyState){
                rootStateSimple = _companyState;
                return CompanyState.createDedupPersons(initialStateMultiple);
            })
            .then(function(_companyState){
                rootStateMultiple = _companyState;
            });

    })

    describe('Change name transaction', function() {
        it('renames company, fail validation (wrong current name)', function() {
            return rootStateSimple.buildPrevious()
                .then(function(companyState){
                    return TransactionService.performInverseNameChange({
                        transactionType: Transaction.types.NAME_CHANGE,
                        previousCompanyName: 'x',
                        newCompanyName: 'x',
                    }, companyState, rootStateSimple).should.eventually.be.rejected;
                })
        });

        it('renames company, fail validation (empty previous name)', function() {
            return rootStateSimple.buildPrevious()
                .then(function(companyState){
                    return TransactionService.performInverseNameChange({
                        transactionType: Transaction.types.NAME_CHANGE,
                        newCompanyName: 'dingbat limited',
                    }, companyState, rootStateSimple).should.eventually.be.rejected;
                });
        });

        it('renames company, fail validation (same name)', function() {
            return rootStateSimple.buildPrevious()
                .then(function(companyState){
                    return TransactionService.performInverseNameChange({
                        transactionType: Transaction.types.NAME_CHANGE,
                        newCompanyName: 'dingbat limited',
                        previousCompanyName: 'dingbat limited'
                    }, companyState, rootStateSimple).should.eventually.be.rejected;
                });
        });

        it('renames company, success', function() {
            var prevState;
            return rootStateSimple.buildPrevious()
                .then(function(companyState){
                    prevState = companyState;
                    return TransactionService.performInverseNameChange({
                        transactionType: Transaction.types.NAME_CHANGE,
                        newCompanyName: 'dingbat limited',
                        previousCompanyName: 'dingbat unlimited'
                    }, companyState, rootStateSimple).should.eventually.be.fulfilled;
                })
                .then(function(transaction){
                    transaction.type.should.be.equal(Transaction.types.NAME_CHANGE);
                    prevState.companyName.should.be.equal('dingbat unlimited');
                })
        });
    });

    describe('Change address transaction', function() {

        it('renames company, fail validation (wrong current address)', function() {
            return rootStateSimple.buildPrevious()
                .then(function(companyState){
                    return TransactionService.performInverseAddressChange({
                        transactionType: Transaction.types.NAME_CHANGE,
                        oldAddress: 'japan',
                        newAddress: 'chinatown',
                        field: 'addressForService',
                    }, companyState, rootStateSimple).should.eventually.be.rejected;
                })
        });

        it('renames company, success', function() {
            var prevState;
            return rootStateSimple.buildPrevious()
                .then(function(companyState){
                    prevState = companyState;
                    return TransactionService.performInverseAddressChange({
                        transactionType: Transaction.types.NAME_CHANGE,
                        previousAddress: 'japan',
                        newAddress: 'china',
                        field: 'addressForService',
                    }, companyState, rootStateSimple).should.eventually.be.fulfilled;
                })
                .then(function(){
                    prevState.addressForService.should.be.equal('japan');
                })
        });
    });

    describe('Change address transaction', function() {

        it('changes address, fail validation (wrong current address)', function() {
            return rootStateSimple.buildPrevious()
                .then(function(companyState){
                    return TransactionService.performInverseAddressChange({
                        transactionType: Transaction.types.NAME_CHANGE,
                        oldAddress: 'japan',
                        newAddress: 'chinatown',
                        field: 'addressForService',
                    }, companyState, rootStateSimple).should.eventually.be.rejected;
                })
        });

        it('changes address, success', function() {
            var prevState;
            return rootStateSimple.buildPrevious()
                .then(function(companyState){
                    prevState = companyState;
                    return TransactionService.performInverseAddressChange({
                        transactionType: Transaction.types.NAME_CHANGE,
                        previousAddress: 'japan',
                        newAddress: 'china',
                        field: 'addressForService',
                    }, companyState, rootStateSimple).should.eventually.be.fulfilled;
                })
                .then(function(){
                    prevState.addressForService.should.be.equal('japan');
                })
        });
    });

    describe('change holding transactions', function() {

        it('changes holding, fail validation (wrong current holding), confirm revert', function() {
            return sequelize.transaction(function(t){
                return rootStateSimple.buildPrevious()
                .then(function(companyState){
                    return TransactionService.performInverseHoldingChange({
                        transactionType: Transaction.types.HOLDING_CHANGE,
                        beforeHolders: [{name: 'mike'}],
                        afterHolders: [{name: 'john'}]
                    }, companyState, rootStateSimple).should.eventually.be.rejected;
                })
            })
            .then(function(){
                return rootStateSimple.reload();
            })
            .then(function(){
                should.equal(null, rootStateSimple.dataValues.holdings[0].dataValues.transactionId);
            })
        });

        it('change holding, success', function() {
            var prevState, date = new Date();
            return rootStateSimple.buildPrevious()
                .then(function(companyState){
                    prevState = companyState;
                    return TransactionService.performInverseHoldingChange({
                        transactionType: Transaction.types.HOLDING_CHANGE,
                        beforeHolders: [{name: 'john'}],
                        afterHolders: [{name: 'mike'}]
                    }, companyState, rootStateSimple, date).should.eventually.be.fulfilled;
                })
                .then(function(e){
                    const _prevState = prevState.toJSON();
                    _prevState.holdings.length.should.be.equal(1);
                    _prevState.holdings[0].holders[0].name.should.be.equal('john');
                    _prevState.holdings[0].parcels[0].amount.should.be.equal(1);
                    return rootStateSimple.dataValues.holdings[0].getTransaction()
                }).then(function(transaction){
                    transaction.type.should.be.equal(Transaction.types.HOLDING_CHANGE);
                    transaction.effectiveDate.should.be.eql(date);
                })
        });
    });

    describe('change holder transactions', function() {
        it('changes a holder, confirms all holdings updated', function() {
            var prevState;
            return rootStateMultiple.buildPrevious()
                .then(function(companyState){
                    prevState = companyState;
                    return TransactionService.performInverseHolderChange({
                        transactionType: Transaction.types.HOLDING_CHANGE,
                        beforeHolder: {name: 'michael'},
                        afterHolder: {name: 'mike'}
                    }, companyState, rootStateMultiple).should.eventually.be.fulfilled;
            })
            .then(function(){
                return prevState.save();
            })
            .then(function(){
                return rootStateMultiple.reload()
            })
            .then(function(){
                const _rootStateMultiple = rootStateMultiple.toJSON();
                rootStateMultiple.getHolderBy({name: 'mike'}).should.not.be.equal(null);
                should.equal(rootStateMultiple.getHolderBy({name: 'michael'}), undefined);
                prevState.getHolderBy({name: 'michael'}).should.not.be.equal(null);
                should.equal(prevState.getHolderBy({name: 'mike'}), undefined);
                rootStateMultiple.getHolderBy({name: 'mike'}).personId.should.be.equal(prevState.getHolderBy({name: 'michael'}).personId)
                rootStateMultiple.getHolderBy({name: 'mike'}).transaction.type.should.be.equal(Transaction.types.HOLDING_CHANGE)
                return prevState.getHolderBy({name: 'michael'}).getHoldings()
            })
            .then(function(holdings){
                holdings.length.should.be.equal(4);
            })
        })
    });

});