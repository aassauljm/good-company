import Promise from "bluebird";
const fs = Promise.promisifyAll(require("fs"));
import moment from 'moment';
import chai from 'chai';
const should = chai.should();

const USER_ID = 1;


describe('Transaction Service', function() {
    describe('Inverse Transactions', function(){
        let rootStateSimple, initialStateSimple = {
            companyName: 'dingbat limited',
            addressForService: 'china',
            holdingList: {holdings: [{
                holders: [{
                    person: {name: 'mike'}
                }],
                parcels: [{
                    amount: 1
                }]
            }]}
        }, rootStateMultiple, initialStateMultiple = {
            companyName: 'multiplex',
            holdingList: {holdings: [{
                holders: [{
                    person: {name: 'mike'}
                }],
                parcels: [{
                    amount: 1
                }]
            },{
                holders: [{
                    person: {name: 'mike'}
                },{
                    person: {name: 'john'}
                }],
                parcels: [{
                    amount: 2
                }]
            },{
                holders: [{
                    person: {name: 'mike'}
                },{
                    person: {name: 'mary'}
                }],
                parcels: [{
                    amount: 3
                }]
            },{
                holders: [{
                    person: {name: 'mike'}
                }],
                parcels: [{
                    amount: 3
                }]
            }]},
            directors: [
                {person: {name: 'mike'}},
                {person: {name: 'jim'}}
            ]
        };

        before(function(){
            return CompanyState.createDedup(initialStateSimple, USER_ID)
                .then(function(_companyState){
                    rootStateSimple = _companyState;
                    return CompanyState.createDedup(initialStateMultiple, USER_ID);
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
                        }, companyState, rootStateSimple, new Date(), USER_ID).should.eventually.be.rejected;
                    })
            });

            it('renames company, fail validation (empty previous name)', function() {
                return rootStateSimple.buildPrevious()
                    .then(function(companyState){
                        return TransactionService.performInverseNameChange({
                            transactionType: Transaction.types.NAME_CHANGE,
                            newCompanyName: 'dingbat limited',
                        }, companyState, rootStateSimple, new Date(), USER_ID).should.eventually.be.rejected;
                    });
            });

            it('renames company, fail validation (same name)', function() {
                return rootStateSimple.buildPrevious()
                    .then(function(companyState){
                        return TransactionService.performInverseNameChange({
                            transactionType: Transaction.types.NAME_CHANGE,
                            newCompanyName: 'dingbat limited',
                            previousCompanyName: 'dingbat limited'
                        }, companyState, rootStateSimple, new Date(), USER_ID).should.eventually.be.rejected;
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
                        }, companyState, rootStateSimple, new Date(), USER_ID).should.eventually.be.fulfilled;
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
                        }, companyState, rootStateSimple, new Date(), USER_ID).should.eventually.be.rejected;
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
                        }, companyState, rootStateSimple, new Date(), USER_ID).should.eventually.be.fulfilled;
                    })
                    .then(function(){
                        prevState.addressForService.should.be.equal('japan');
                    })
            });
        });

        describe.skip('change holding transactions', function() {

            it('changes holding, fail validation (wrong current holding), confirm revert', function() {
                return sequelize.transaction(function(t){
                    return rootStateSimple.buildPrevious()
                    .then(function(companyState){
                        return TransactionService.performInverseHoldingChange({
                            transactionType: Transaction.types.HOLDING_CHANGE,
                            beforeHolders: [{name: 'mike'}],
                            afterHolders: [{name: 'john'}]
                        }, companyState, rootStateSimple, new Date(), USER_ID).should.eventually.be.rejected;
                    })
                })
                .then(function(){
                    return rootStateSimple.reload();
                })
                .then(function(){
                    should.equal(null, rootStateSimple.dataValues.holdingList.holdings[0].dataValues.transactionId);
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
                        }, companyState, rootStateSimple, date, USER_ID).should.eventually.be.fulfilled;
                    })
                    .then(function(e){
                        const _prevState = prevState.toJSON();
                        _prevState.holdingList.holdings.length.should.be.equal(1);
                        _prevState.holdingList.holdings[0].holders[0].name.should.be.equal('john');
                        _prevState.holdingList.holdings[0].parcels[0].amount.should.be.equal(1);
                        return rootStateSimple.dataValues.holdingList.holdings[0].getTransaction()
                    }).then(function(transaction){
                        transaction.type.should.be.equal(Transaction.types.HOLDING_CHANGE);
                        transaction.effectiveDate.should.be.eql(date);
                    });
            });
        });

        describe.skip('change holder transactions', function() {

            it('changes a name, confirms all holdings updated', function() {
                let prevState;
                return rootStateMultiple.buildPrevious()
                    .then(function(companyState){
                        prevState = companyState;
                        return TransactionService.performInverseHolderChange({
                            transactionType: Transaction.types.HOLDING_CHANGE,
                            beforeHolder: {name: 'michael'},
                            afterHolder: {name: 'mike'}
                        }, companyState, rootStateMultiple, new Date(), USER_ID).should.eventually.be.fulfilled;
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
                    rootStateMultiple.getHolderBy({name: 'mike'}).personId.should.be.equal(prevState.getHolderBy({name: 'michael'}).personId);
                    rootStateMultiple.getHolderBy({name: 'mike'}).transaction.type.should.be.equal(Transaction.types.HOLDING_CHANGE);
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
                            transactionMethod: Transaction.types.AMEND,
                            transactionType: Transaction.types.ISSUE_TO,
                            afterHolders: [{name: 'mike'}, {name: 'cindy'}],
                            beforeHolders: [{name: 'mike'}, {name: 'cindy'}],
                            beforeAmount: 0,
                            afterAmount: 1
                        }, companyState, rootStateMultiple, new Date(), USER_ID).should.eventually.be.rejected;
                    });
            });
            it('amend holding with issue, fail due to negative value', function() {
                return rootStateMultiple.buildPrevious()
                    .then(function(companyState){
                        return TransactionService.performInverseAmend({
                            transactionMethod: Transaction.types.AMEND,
                            transactionType: Transaction.types.ISSUE_TO,
                            afterHolders: [{name: 'mike'}],
                            beforeHolders: [{name: 'mike'}],
                            beforeAmount: -1,
                            afterAmount: 1
                        }, companyState, rootStateMultiple, new Date(), USER_ID).should.eventually.be.rejected;
                    });
            });
            it('amend holding with issue, fail due non matching value', function() {
                return rootStateMultiple.buildPrevious()
                    .then(function(companyState){
                        return TransactionService.performInverseAmend({
                            transactionMethod: Transaction.types.AMEND,
                            transactionType: Transaction.types.ISSUE_TO,
                            afterHolders: [{name: 'mike'}],
                            beforeHolders: [{name: 'mike'}],
                            beforeAmount: 0,
                            afterAmount: 2
                        }, companyState, rootStateMultiple, new Date(), USER_ID).should.eventually.be.rejected;
                    });
            });
            it('amend holding with issue, success', function() {
                let prevState;
                return rootStateMultiple.buildPrevious()
                    .then(function(companyState){
                        prevState = companyState;
                        return TransactionService.performInverseAmend({
                            transactionMethod: Transaction.types.AMEND,
                            transactionType: Transaction.types.ISSUE_TO,
                            afterHolders: [{name: 'mike'}],
                            beforeHolders: [{name: 'mike'}],
                            beforeAmount: 0,
                            afterAmount: 1
                        }, companyState, rootStateMultiple, new Date(), USER_ID).should.eventually.be.fulfilled;
                    })
                    .then(function(){
                        return rootStateMultiple.reload();
                    })
                    .then(function(){
                        const holding = rootStateMultiple.getMatchingHolding({holders: [{name: 'mike'}], parcels: [{amount: 1}]});
                        holding.transaction.type.should.be.equal(Transaction.types.ISSUE_TO);
                    });
            });
        });

            //director transactions, should effect a shareholder, maybe

        /* describe('director transaction', function() {
                it('new director, should fail', function() {
                    return rootStateMultiple.buildPrevious()
                        .then(function(companyState){
                            return TransactionService.performInverseNewDirector({
                                transactionType: Transaction.types.ISSUE_TO,
                                afterHolders: [{name: 'mike'}, {name: 'cindy'}],
                                beforeHolders: [{name: 'mike'}, {name: 'cindy'}],
                                beforeAmount: 0,
                                afterAmount: 1
                            }, companyState, rootStateMultiple).should.eventually.be.rejected;
                        });
                });
        });*/
    });



    describe('Forward Transactions', function(){
        let rootStateSimple, initialStateSimple = {
            companyName: 'dingbat limited',
            addressForService: 'china',
            holdingList: {holdings: [{
                holders: [{
                    person: {name: 'mike'}
                }],
                parcels: [{
                    amount: 1
                }]
            }]
            }
        }, rootStateMultiple, initialStateMultiple = {
            companyName: 'multiplex',
            holdingList: { holdings: [{
                holders: [{
                    person: {name: 'mike'}
                }],
                parcels: [{
                    amount: 1
                }]
            },{
                holders: [{
                    person: {name: 'mike'}
                },{
                    person: {name: 'john'}
                }],
                parcels: [{
                    amount: 2
                }]
            },{
                holders: [{
                    person: {name: 'mike'}
                },{
                    person: {name: 'mary'}
                }],
                parcels: [{
                    amount: 3
                }]
            },{
                holders: [{
                    person: {name: 'mike'}
                }],
                parcels: [{
                    amount: 3
                }]
            },{
                holders: [{
                    person: {name: 'sarah'}
                }],
                parcels: [{
                    amount: 1
                }]
            }]
        },
            directors: [
                {person: {name: 'mike'}},
                {person: {name: 'jim'}},
            ]
        };

        before(function(){
            return CompanyState.createDedup(initialStateSimple)
                .then(function(_companyState){
                    rootStateSimple = _companyState;
                    return CompanyState.createDedup(initialStateMultiple, USER_ID);
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
                        }, companyState, rootStateSimple, new Date(), USER_ID).should.eventually.be.rejected;
                    })
            });

            it('renames company, fail validation (empty previous name)', function() {
                return rootStateSimple.buildNext()
                    .then(function(companyState){
                        return TransactionService.performNameChange({
                            transactionType: Transaction.types.NAME_CHANGE,
                            newCompanyName: 'dingbat limited',
                        }, companyState, rootStateSimple, new Date(), USER_ID).should.eventually.be.rejected;
                    });
            });

            it('renames company, fail validation (same name)', function() {
                return rootStateSimple.buildNext()
                    .then(function(companyState){
                        return TransactionService.performNameChange({
                            transactionType: Transaction.types.NAME_CHANGE,
                            newCompanyName: 'dingbat limited',
                            previousCompanyName: 'dingbat limited'
                        }, companyState, rootStateSimple, new Date(), USER_ID).should.eventually.be.rejected;
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
                        }, companyState, rootStateSimple, new Date(), USER_ID).should.eventually.be.fulfilled;
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
                            afterHolders: [{name: 'john'}]
                        }, companyState, rootStateSimple, new Date(), USER_ID).should.eventually.be.rejected;
                    })

            });

            it('change holding, success', function() {
                let nextState, date = new Date();
                return rootStateMultiple.buildNext()
                    .then(function(companyState){
                        nextState = companyState;
                        return TransactionService.performHoldingChange({
                            transactionType: Transaction.types.HOLDING_CHANGE,
                            afterVotingShareholder: {name: 'john'},
                            afterName:'xxx',
                            beforeHolders: [{name: 'john'}, {name: 'mike'}],
                            afterHolders: [{name: 'john'}, {name: 'mike'}],
                        }, companyState, rootStateSimple, date, USER_ID).should.eventually.be.fulfilled;
                    })
                    .then(function(e){
                        const _nextState = nextState.toJSON();
                        _nextState.holdingList.holdings.length.should.be.equal(5);
                        const holding = _.find(_nextState.holdingList.holdings, {name: 'xxx'});

                        holding.parcels[0].amount.should.be.equal(2);
                        const transaction = holding.transaction;
                        transaction.type.should.be.equal(Transaction.types.HOLDING_CHANGE);
                        transaction.effectiveDate.should.be.eql(date);
                        const holder = _.find(holding.holders, h => _.isMatch(h.person, {name: 'john'}));
                         holder.data.votingShareholder.should.be.equal(true);
                    });
            });
        });

        describe.skip('change holder transactions', function() {
            it('changes a holder, confirms all holdings updated', function() {
                let nextState;
                return rootStateMultiple.buildNext()
                    .then(function(companyState){
                        nextState = companyState;
                        return TransactionService.performHolderChange({
                            transactionType: Transaction.types.HOLDING_CHANGE,
                            afterHolder: {name: 'mitchel'},
                            beforeHolder: {name: 'mike'}
                        }, companyState, rootStateMultiple, new Date(), USER_ID).should.eventually.be.fulfilled;
                })
                .then(function(){
                    return nextState.save();
                })
                .then(function(){
                    return nextState.reload();
                })
                .then(function(){
                    const _rootStateMultiple = rootStateMultiple.toJSON();
                    rootStateMultiple.getHolderBy({name: 'mike'}).should.not.be.equal(null);
                    should.equal(rootStateMultiple.getHolderBy({name: 'mitchel'}), undefined);
                    nextState.getHolderBy({name: 'mitchel'}).should.not.be.equal(null);
                    should.equal(nextState.getHolderBy({name: 'mike'}), undefined);
                    rootStateMultiple.getHolderBy({name: 'mike'}).personId.should.be.equal(nextState.getHolderBy({name: 'mitchel'}).personId)
                    nextState.getHolderBy({name: 'mitchel'}).transaction.type.should.be.equal(Transaction.types.HOLDING_CHANGE);
                })
            })
        });


        describe('apply share classes', function() {
            let nextState, holdingId, id;
            it('adds a share class to each holding', function() {
                return rootStateMultiple.buildNext()
                    .then(function(companyState){
                        nextState = companyState;
                        const holding = companyState.getMatchingHolding({holders: [{name: 'mike'}, {name: 'john'}]});
                        holdingId = holding.holdingId;
                        id = holding.id;
                        return TransactionService.performApplyShareClass({
                            transactionType: Transaction.types.APPLY_SHARE_CLASS,
                            holdingId: holdingId,
                            parcels:[{shareClass: 1, amount: holding.parcels[0].amount}]
                        }, companyState, rootStateMultiple, new Date(), USER_ID).should.eventually.be.fulfilled;
                    })
                    .then(function(){
                        return nextState.save();
                    })
                    .then(function(){
                        return nextState.reload();
                    })
                    .then(function(){
                        const holding = nextState.getMatchingHolding({holders: [{name: 'mike'}, {name: 'john'}]})
                        holding.parcels[0].shareClass.should.be.equal(1);
                        holding.holdingId.should.be.equal(holdingId)
                        holding.id.should.not.be.equal(id);
                    })
            })
        });

        describe('transfer', function() {
            let nextState, holdingId1, holdingId2, id;
            it('transfer from 1 holding to another', function() {
                return rootStateMultiple.buildNext()
                    .then(function(companyState){
                        nextState = companyState;
                        holdingId1 = companyState.getMatchingHolding({holders: [{name: 'mike'}, {name: 'john'}]}).holdingId;
                        holdingId2 = companyState.getMatchingHolding({holders: [{name: 'mike'}, {name: 'mary'}]}).holdingId;
                        return TransactionService.performAmend({
                                holdingId: holdingId1,
                                amount: 1,
                                beforeAmount: 2,
                                afterAmount: 1,
                                transactionType: Transaction.types.TRANSFER_FROM,
                                transactionMethod: Transaction.types.AMEND
                        }, companyState, rootStateMultiple, new Date(), USER_ID).should.eventually.be.fulfilled;
                    })
                    .then(function(){
                        return TransactionService.performAmend({
                            holdingId: holdingId2,
                            amount: 1,
                            beforeAmount: 3,
                            afterAmount: 4,
                            transactionType: Transaction.types.TRANSFER_TO,
                            transactionMethod: Transaction.types.AMEND
                        }, nextState, rootStateMultiple, new Date(), USER_ID).should.eventually.be.fulfilled;
                    })
                    .then(function(){
                        return nextState.save();
                    })
                    .then(function(){
                        return nextState.reload();
                    })
                    .then(function(){
                        const holding1 = nextState.getMatchingHolding({holdingId: holdingId1})
                        const holding2 = nextState.getMatchingHolding({holdingId: holdingId2})
                        holding1.parcels[0].amount.should.be.equal(1)
                        holding2.parcels[0].amount.should.be.equal(4)
                    })
            })
        });


        describe('change historic holders', function() {
            let nextState, id, holdingId, personId, states = [];
            it('removes are holder, then updates their info', function() {
                return rootStateMultiple.buildNext({previousCompanyStateId: rootStateMultiple.dataValues.id})
                    .then(function(companyState){
                        // Start with a sarah in the shareholdings, and amend it to 0
                        nextState = companyState;
                        states.push(nextState);
                        holdingId = companyState.getMatchingHolding({holders: [{name: 'sarah'}], parcels: [{amount: 1}]}).holdingId;
                        personId = companyState.getMatchingHolding({holders: [{name: 'sarah'}], parcels: [{amount: 1}]}).holders[0].person.personId;
                        return TransactionService.performAmend({
                                holdingId: holdingId,
                                amount: 1,
                                beforeAmount: 1,
                                afterAmount: 0,
                                transactionType: Transaction.types.REDEMPTION_FROM,
                                transactionMethod: Transaction.types.AMEND
                        }, companyState, rootStateMultiple, new Date(), USER_ID).should.eventually.be.fulfilled;
                    })
                    .then(function(){
                        return nextState.save();
                    })
                    .then(function(){
                        return nextState.buildNext({previousCompanyStateId: nextState.dataValues.id});
                    })
                    .then(function(companyState){
                        // How remove sarah from the company
                        nextState = companyState;
                        states.push(nextState);
                        return TransactionService.performRemoveAllocation({
                            holdingId: holdingId,
                            transactionType: Transaction.types.REMOVE_ALLOCATION,
                        }, nextState, states[0], new Date(), USER_ID).should.eventually.be.fulfilled;
                    })
                    .then(function(){
                        return nextState.save();
                    })
                    .then(function(companyState){
                        return sequelize.query("select * from company_persons(:id) where current = FALSE",
                               { type: sequelize.QueryTypes.SELECT,
                                replacements: { id: companyState.id}})
                    })
                    .then(function(results){
                        results.length.should.be.equal(1);
                        results[0].should.containSubset({name: 'sarah', personId: personId});
                    })
                    .then(function(){
                        return nextState.buildNext({previousCompanyStateId: nextState.dataValues.id});
                    })
                    .then(function(companyState){
                        nextState = companyState;
                        states.push(nextState);
                        // Now update sarahs name
                        return TransactionService.performHistoricHolderChange({
                            beforeHolder: {
                                name: 'sarah',
                                personId: personId
                            },
                            afterHolder: {
                                name: 'sara'
                            },
                            transactionType: Transaction.types.HISTORIC_HOLDER_CHANGE,
                        }, nextState, states[1], new Date(), USER_ID).should.eventually.be.fulfilled;
                    })
                    .then(function(){
                        return nextState.save();
                    })
                    .then(function(companyState){
                        // Now make sure its the result of company_persons
                        return sequelize.query("select * from company_persons(:id) where current = FALSE",
                               { type: sequelize.QueryTypes.SELECT,
                                replacements: { id: companyState.id}})
                    })
                    .then(function(results){
                        results.length.should.be.equal(1);
                        results[0].should.containSubset({name: 'sara', personId: personId});
                    })
                    .then(function(){
                        return nextState.buildNext({previousCompanyStateId: nextState.dataValues.id});
                    })
                    .then(function(companyState){
                        nextState = companyState;
                        states.push(nextState);
                        return TransactionService.performHistoricHolderChange({
                            beforeHolder: {
                                name: 'sara',
                                personId: personId
                            },
                            afterHolder: {
                                name: 'sarak'
                            },
                            transactionType: Transaction.types.HISTORIC_HOLDER_CHANGE,
                        }, nextState, states[2], new Date(), USER_ID).should.eventually.be.fulfilled;
                    })
                    .then(function(){
                        return nextState.save();
                    })
                    .then(function(companyState){
                        return sequelize.query("select * from company_persons(:id) where current = FALSE",
                               { type: sequelize.QueryTypes.SELECT,
                                replacements: { id: companyState.id}})
                    })
                    .then(function(results){
                        results.length.should.be.equal(1);
                        results[0].should.containSubset({name: 'sarak', personId: personId});
                    })
            })
        });



    });
});