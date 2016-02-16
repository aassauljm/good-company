import Promise from "bluebird";
const fs = Promise.promisifyAll(require("fs"));
import moment from 'moment';
import chai from 'chai';
const should = chai.should();


describe('Transaction Service, inverse transactions', function() {
    describe('Inverse Transactions', function(){
        let rootStateSimple, initialStateSimple = {
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
                    amount: 3
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

        });

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
                let prevState;
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

            it('Change address, fail validation (wrong current address)', function() {
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

            it('Change address, success', function() {
                let prevState;
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
                let prevState, date = new Date();
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
                    });
            });
        });

        describe('change holder transactions', function() {
            it('changes a holder, confirms all holdings updated', function() {
                let prevState;
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

        describe('amend holding transactions', function() {
            it('amend holding with issue, fail to find matching holding', function() {
                return rootStateMultiple.buildPrevious()
                    .then(function(companyState){
                        return TransactionService.performInverseAmend({
                            transactionType: Transaction.types.ISSUE_TO,
                            afterHolders: [{name: 'mike'}, {name: 'cindy'}],
                            beforeHolders: [{name: 'mike'}, {name: 'cindy'}],
                            beforeAmount: 0,
                            afterAmount: 1
                        }, companyState, rootStateMultiple).should.eventually.be.rejected;
                    });
            });
            it('amend holding with issue, fail due to negative value', function() {
                return rootStateMultiple.buildPrevious()
                    .then(function(companyState){
                        return TransactionService.performInverseAmend({
                            transactionType: Transaction.types.ISSUE_TO,
                            afterHolders: [{name: 'mike'}],
                            beforeHolders: [{name: 'mike'}],
                            beforeAmount: -1,
                            afterAmount: 1
                        }, companyState, rootStateMultiple).should.eventually.be.rejected;
                    });
            });
            it('amend holding with issue, fail due non matching value', function() {
                return rootStateMultiple.buildPrevious()
                    .then(function(companyState){
                        return TransactionService.performInverseAmend({
                            transactionType: Transaction.types.ISSUE_TO,
                            afterHolders: [{name: 'mike'}],
                            beforeHolders: [{name: 'mike'}],
                            beforeAmount: 0,
                            afterAmount: 2
                        }, companyState, rootStateMultiple).should.eventually.be.rejected;
                    });
            });
            it('amend holding with issue, success', function() {
                let prevState;
                return rootStateMultiple.buildPrevious()
                    .then(function(companyState){
                        prevState = companyState;
                        return TransactionService.performInverseAmend({
                            transactionType: Transaction.types.ISSUE_TO,
                            afterHolders: [{name: 'mike'}],
                            beforeHolders: [{name: 'mike'}],
                            beforeAmount: 0,
                            afterAmount: 1
                        }, companyState, rootStateMultiple).should.eventually.be.fulfilled;
                    })
                    .then(function(){
                        return rootStateMultiple.reload();
                    })
                    .then(function(){
                        const holding = rootStateMultiple.getMatchingHolding([{name: 'mike'}], [{amount: 1}]);
                        holding.transaction.type.should.be.equal(Transaction.types.ISSUE_TO);
                    });
            });
        });
    });



    describe('Forward Transactions', function(){
        let rootStateSimple, initialStateSimple = {
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
                    amount: 3
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

        });

        describe('Change name transaction', function() {
            it('renames company, fail validation (wrong current name)', function() {
                return rootStateSimple.buildNext()
                    .then(function(companyState){
                        return TransactionService.performNameChange({
                            transactionType: Transaction.types.NAME_CHANGE,
                            previousCompanyName: 'x',
                            newCompanyName: 'x',
                        }, companyState, rootStateSimple).should.eventually.be.rejected;
                    })
            });

            it('renames company, fail validation (empty previous name)', function() {
                return rootStateSimple.buildNext()
                    .then(function(companyState){
                        return TransactionService.performNameChange({
                            transactionType: Transaction.types.NAME_CHANGE,
                            newCompanyName: 'dingbat limited',
                        }, companyState, rootStateSimple).should.eventually.be.rejected;
                    });
            });

            it('renames company, fail validation (same name)', function() {
                return rootStateSimple.buildNext()
                    .then(function(companyState){
                        return TransactionService.performNameChange({
                            transactionType: Transaction.types.NAME_CHANGE,
                            newCompanyName: 'dingbat limited',
                            previousCompanyName: 'dingbat limited'
                        }, companyState, rootStateSimple).should.eventually.be.rejected;
                    });
            });

            it('renames company, success', function() {
                let nextState;
                return rootStateSimple.buildNext()
                    .then(function(companyState){
                        nextState = companyState;
                        return TransactionService.performNameChange({
                            transactionType: Transaction.types.NAME_CHANGE,
                            newCompanyName: 'dingbat unlimited',
                            previousCompanyName: 'dingbat limited'
                        }, companyState, rootStateSimple).should.eventually.be.fulfilled;
                    })
                    .then(function(transaction){
                        transaction.type.should.be.equal(Transaction.types.NAME_CHANGE);
                        nextState.companyName.should.be.equal('dingbat unlimited');
                    })
            });
        });

        describe('Change address transaction', function() {

            it('Change address, fail validation (wrong current address)', function() {
                return rootStateSimple.buildNext()
                    .then(function(companyState){
                        return TransactionService.performAddressChange({
                            transactionType: Transaction.types.NAME_CHANGE,
                            newAddress: 'japan',
                            previousAddress: 'chinatown',
                            field: 'addressForService',
                        }, companyState, rootStateSimple).should.eventually.be.rejected;
                    })
            });

            it('Change address, success', function() {
                let nextState;
                return rootStateSimple.buildNext()
                    .then(function(companyState){
                        nextState = companyState;
                        return TransactionService.performAddressChange({
                            transactionType: Transaction.types.NAME_CHANGE,
                            newAddress: 'japan',
                            previousAddress: 'china',
                            field: 'addressForService',
                        }, companyState, rootStateSimple).should.eventually.be.fulfilled;
                    })
                    .then(function(){
                        nextState.addressForService.should.be.equal('japan');
                    })
            });
        });

        describe('change holding transactions', function() {

            it('changes holding, fail validation (wrong current holding)', function() {
                return rootStateSimple.buildNext()
                    .then(function(companyState){
                        return TransactionService.performHoldingChange({
                            transactionType: Transaction.types.HOLDING_CHANGE,
                            beforeHolders: [{name: 'john'}],
                            afterHolders: [{name: 'mike'}]
                        }, companyState, rootStateSimple).should.eventually.be.rejected;
                    })

            });

            it('change holding, success', function() {
                let nextState, date = new Date();
                return rootStateSimple.buildNext()
                    .then(function(companyState){
                        nextState = companyState;
                        return TransactionService.performHoldingChange({
                            transactionType: Transaction.types.HOLDING_CHANGE,
                            beforeHolders: [{name: 'mike'}],
                            afterHolders: [{name: 'john'}]
                        }, companyState, rootStateSimple, date).should.eventually.be.fulfilled;
                    })
                    .then(function(e){
                        const _nextState = nextState.toJSON();
                        _nextState.holdings.length.should.be.equal(1);
                        _nextState.holdings[0].holders[0].name.should.be.equal('john');
                        _nextState.holdings[0].parcels[0].amount.should.be.equal(1);
                        const transaction = nextState.dataValues.holdings[0].dataValues.transaction;
                        transaction.type.should.be.equal(Transaction.types.HOLDING_CHANGE);
                        transaction.effectiveDate.should.be.eql(date);
                    });
            });
        });

    });
});