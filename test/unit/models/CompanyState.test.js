"use strict";

describe('CompanyState Model', function() {
    describe('Create CompanyState Holdings', function() {

        it('should calculate holding totals', function(done) {
            CompanyState.create({
                    companyName: 'hax',
                    holdingList: {
                        holdings: [{
                        parcels: [{
                            amount: 10,
                            shareClass: 1
                        }, {
                            amount: 1,
                            shareClass: 2
                        }],
                        holders: [{
                            person:{name: 'Mike'}
                        }]
                    }, {
                        parcels: [{
                            amount: 10,
                            shareClass: 2
                        }, {
                            amount: 1,
                            shareClass: 3
                        }],
                        holders: [{
                            person:{name: 'Gary'}
                        }]
                    }, {
                        parcels: [{
                            amount: 1,
                            shareClass: 1
                        }, {
                            amount: 1,
                            shareClass: 2
                        }],
                        holders: [{
                            name: 'Peter'
                        }]
                    }]
                    }
                }, {
                    include: [{
                        model: HoldingList,
                        as: 'holdingList',
                            include: [{
                            model: Holding,
                            as: 'holdings',
                            include: [{
                                model: Parcel,
                                as: 'parcels'
                            }, {
                                model: Holder,
                                as: 'holders',
                                include: [{
                                    model: Person,
                                    as: 'person'
                                }]
                            }]
                        }]

                    }]
                })
                .then(function(state) {
                    this.state = state;
                    return state.groupShares()
                })
                .then(function(groups) {
                    groups.should.containSubset({
                        1: [{
                            amount: 10,
                            shareClass: 1
                        }, {
                            amount: 1,
                            shareClass: 1
                        }],
                        2: [{
                            amount: 1,
                            shareClass: 2
                        }, {
                            amount: 1,
                            shareClass: 2
                        }, {
                            amount: 10,
                            shareClass: 2
                        }],
                        3: [{
                            amount: 1,
                            shareClass: 3
                        }]
                    })
                    return this.state.groupTotals();
                })
                .then(function(groupTotals){
                    groupTotals.should.containSubset({
                        1: {amount: 11},
                        2: {amount: 12},
                        3: {amount: 1}
                    });
                    return this.state.totalAllocatedShares();
                })
                .then(function(totalShares){
                    totalShares.should.be.eql(24)
                    done();
                });
        });
        it('should clone holdings', function(done) {
            CompanyState.create({
                companyName: 'hax',
                holdingList: {
                    holdings: [{
                        parcels: [{
                            amount: 10,
                            shareClass: 1
                        }, {
                            amount: 1,
                            shareClass: 2
                        }],
                        holders: [{
                            person: {name: 'Simon Slimjim'}
                        }]
                    }]
                }
            }, {
                    include: [{
                        model: HoldingList,
                        as: 'holdingList',
                            include: [{
                            model: Holding,
                            as: 'holdings',
                            include: [{
                                model: Parcel,
                                as: 'parcels'
                            }, {
                                model: Holder,
                                as: 'holders',
                                include: [{
                                    model: Person,
                                    as: 'person'
                                }]
                            }]
                        }]
                    }]
            })
            .then(function(state){
                this.first_state = state;
                return state.buildNext({ type: Transaction.types.SEED});
            })
            .then(function(second_state){
                this.second_state = second_state;
                return second_state.fullPopulate();
            })
            .then(function(){
                this.first_state.holdingList.holdings.length.should.be.eql(1);
                this.second_state.holdingList.holdings.length.should.be.eql(1);
                this.first_state.holdingList.holdings[0].parcels.length.should.be.eql(2);
                this.second_state.holdingList.holdings[0].parcels.length.should.be.eql(2);
                this.first_state.id.should.not.eql(this.second_state.id)
                var first_tran_share_a = _.find(this.first_state.holdingList.holdings[0].parcels, {shareClass: 1});
                var first_tran_share_b = _.find(this.first_state.holdingList.holdings[0].parcels, {shareClass: 2});
                var second_tran_share_a = _.find(this.second_state.holdingList.holdings[0].parcels, {shareClass: 1});
                var second_tran_share_b = _.find(this.second_state.holdingList.holdings[0].parcels, {shareClass: 2});
                first_tran_share_a.amount.should.be.eql(10);
                second_tran_share_a.amount.should.be.eql(10);
                first_tran_share_a.id.should.be.eql(second_tran_share_a.id);
                first_tran_share_b.amount.should.be.eql(1);
                second_tran_share_b.amount.should.be.eql(1);
                first_tran_share_b.id.should.be.eql(second_tran_share_b.id);
                this.first_state.holdingList.holdings[0].holders.length.should.be.eql(1);
                this.second_state.holdingList.holdings[0].holders.length.should.be.eql(1);
                this.first_state.holdingList.holdings[0].holders[0].person.id.should.be.eql(
                    this.second_state.holdingList.holdings[0].holders[0].person.id);
                this.first_state.holdingList.holdings[0].holders[0].person.personId.should.be.eql(
                    this.second_state.holdingList.holdings[0].holders[0].person.personId);

                done();
            });
        });
        it('should add some unallocated shares', function(done){
            CompanyState.create({
                companyName: 'hax',
                holdingList: {
                    holdings: [{
                        parcels: [{
                            amount: 10,
                            shareClass: 1
                        }],
                        holders: [{
                            person: {name: 'Randy'}
                        }]
                    }]
                },
                unallocatedParcels: [
                    {
                        amount: 100,
                        shareClass: 1
                    }]
                }, {
                    include: [{
                        model: HoldingList,
                        as: 'holdingList',
                            include: [{
                            model: Holding,
                            as: 'holdings',
                            include: [{
                                model: Parcel,
                                as: 'parcels'
                            }, {
                                model: Holder,
                                as: 'holders',
                                include: [{
                                    model: Person,
                                    as: 'person'
                                }]
                            }]
                        }]
                    }, {
                    model: Parcel,
                    as: 'unallocatedParcels'
                }]})
                .then(function(state){
                    state.totalAllocatedShares().should.eventually.become(10)
                        .notify(done)

                })
        })
    });
    describe('Basic transformations of company state', function() {
        var initialState = {
                companyName: 'Party Sisters',
                holdingList: {
                    holdings: [{
                        name: 'Allocation 1',
                        parcels: [{
                            amount: 10,
                            shareClass: 1
                        }, {
                            amount: 1,
                            shareClass: 2
                        }],
                        holders: [{
                            person:{ name: 'Sally Slimjim'}
                        },{
                            person: {name: 'Mickey Twofists'}
                        }]
                    },
                    {
                        name: 'Allocation 2',
                        parcels: [{
                            amount: 1,
                            shareClass: 1
                        }, {
                            amount: 1,
                            shareClass: 2
                        }],
                        holders: [{
                            person:{ name: 'Mickey Twofists'}
                        }, {
                            person:{ name: 'Johansen McKenzie'}
                        }]
                }]
                }
            };

        it('populates company state and confirms person deduplication and associations', function(done){
            CompanyState.createDedup(initialState, null)
                .then(function(companyState){
                    var firstMicky = _.find(companyState.holdingList.holdings[0].holders, h => _.isMatch(h.person, {name: 'Mickey Twofists'})).person;
                    var secondMicky = _.find(companyState.holdingList.holdings[1].holders, h => _.isMatch(h.person,  {name: 'Mickey Twofists'})).person;
                    firstMicky.dataValues.should.be.deep.equal(secondMicky.dataValues);
                    const holdings = companyState.holdingList.holdings;
                    holdings.length.should.be.equal(2);
                    var firstAlloc = _.find(holdings, {name: 'Allocation 1'});
                    const parcels = firstAlloc.parcels;
                    parcels.length.should.be.equal(2);
                    _.find(parcels, {amount: 10}).shareClass.should.be.equal(1);
                    done();
                });
        });
    });

    describe('Creation of new states with various options', function() {
        var initialState = {
                companyName: 'German Dumptrucks',
                holdingList: {
                    holdings: [{
                        name: 'Allocation 1',
                        parcels: [{
                            amount: 10,
                            shareClass: 1
                        }],
                        holders: [{
                            person:{ name: 'Sally Slimjim'}
                        }]
                    }]
                }
            };

        it('populates company state, builds new, checks ids', function(done){
            let firstState, nextState, newRecordState;
            CompanyState.createDedup(initialState, null)
                .then(function(companyState){
                    firstState = companyState.toJSON();
                    return companyState.buildNext()
                })
                .then(function(s){ return s.save();})
                .then(function(companyState){
                    nextState = companyState.toJSON();
                    return companyState.buildNext({}, {newRecords: true});
                })
                .then(function(s){ return s.save();})
                .then(function(companyState){
                    newRecordState = companyState.toJSON();

                    firstState.holdingList.id.should.be.equal(nextState.holdingList.id);
                    firstState.holdingList.id.should.not.be.equal(newRecordState.holdingList.id);

                    firstState.holdingList.id.should.not.be.equal(newRecordState.holdingList.id);

                    firstState.holdingList.holdings[0].id.should.be.equal(nextState.holdingList.holdings[0].id);
                    firstState.holdingList.holdings[0].id.should.not.be.equal(newRecordState.holdingList.holdings[0].id);

                    firstState.holdingList.holdings[0].id.should.be.equal(nextState.holdingList.holdings[0].id);
                    firstState.holdingList.holdings[0].id.should.not.be.equal(newRecordState.holdingList.holdings[0].id);

                    firstState.holdingList.holdings[0].holdingId.should.be.equal(nextState.holdingList.holdings[0].holdingId);
                    firstState.holdingList.holdings[0].holdingId.should.be.equal(newRecordState.holdingList.holdings[0].holdingId);


                    firstState.holdingList.holdings[0].holders[0].person.id.should.be.equal(nextState.holdingList.holdings[0].holders[0].person.id);
                    firstState.holdingList.holdings[0].holders[0].person.id.should.not.be.equal(newRecordState.holdingList.holdings[0].holders[0].person.id);

                    firstState.holdingList.holdings[0].holders[0].person.personId.should.be.equal(nextState.holdingList.holdings[0].holders[0].person.personId);
                    firstState.holdingList.holdings[0].holders[0].person.personId.should.be.equal(newRecordState.holdingList.holdings[0].holders[0].person.personId);

                    done();
                });
        });
    });


    describe('Test warnings ', function() {
        let company, initialState = {
            companyName: 'warning limited',
                holdingList: {
                    holdings: [{
                        name: 'Allocation 1',
                        parcels: [{
                            amount: 1,
                        }],
                        holders: [{
                            person:{ name: 'jimbo robinson'}
                        },{
                            person:{ name: 'janson rimblesnotch'}
                        }]
                    }]
                }
        };

        before(() => {
            return Company.create({})
            .then((_c) => {
                company = _c;
                return CompanyState.createDedup(initialState)
            })
            .then((state) => {
                return state.buildNext({previousCompanyStateId: state.dataValues.id})
            })
            .then((state) => {
                return state.save();
            })
            .then((state) => {
                return state.buildNext({previousCompanyStateId: state.dataValues.id})
            })
            .then((state) => {
                return state.save();
            })
            .then((state) => {
                return company.setCurrentCompanyState(state);
            })
        });
/*
        'pendingHistory', has_pending_historic_actions($1),
        'pendingFuture', COALESCE(has_pending_future_actions($1), FALSE),
        'missingVotingShareholders', has_missing_voting_shareholders($1),
        'shareClassWarning', has_no_share_classes($1),
        'applyShareClassWarning', has_no_applied_share_classes($1),
        'extensiveWarning', has_extensive_shareholding($1),

*/

        it('current should have warnings', () => {
            return company.getCurrentCompanyState()
                .then(state => {
                    state.warnings.shareClassWarning.should.be.equal(true);
                    state.warnings.missingVotingShareholders.should.be.equal(true);
                    state.warnings.applyShareClassWarning.should.be.equal(true);
                    state.warnings.pendingHistory.should.be.equal(false);
                    state.warnings.pendingFuture.should.be.equal(false);
                })
        })


        it('root should have warnings', () => {
            return company.getRootCompanyState()
                .then(state => {
                    state.warnings.shareClassWarning.should.be.equal(true);
                    state.warnings.missingVotingShareholders.should.be.equal(true);
                    state.warnings.applyShareClassWarning.should.be.equal(true);
                    state.warnings.pendingHistory.should.be.equal(false);
                    state.warnings.pendingFuture.should.be.equal(false);
                })
        })

    });


});