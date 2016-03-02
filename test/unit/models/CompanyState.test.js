describe('CompanyState Model', function() {
    describe('Create CompanyState Holdings', function() {

        it('should calculate holding totals', function(done) {
            CompanyState.create({
                    companyName: 'hax',
                    holdings: [{
                        parcels: [{
                            amount: 10,
                            shareClass: 'A'
                        }, {
                            amount: 1,
                            shareClass: 'B'
                        }],
                        holders: [{
                            name: 'Mike'
                        }]
                    }, {
                        parcels: [{
                            amount: 10,
                            shareClass: 'B'
                        }, {
                            amount: 1,
                            shareClass: 'C'
                        }],
                        holders: [{
                            name: 'Gary'
                        }]
                    }, {
                        parcels: [{
                            amount: 1,
                            shareClass: 'A'
                        }, {
                            amount: 1,
                            shareClass: 'B'
                        }],
                        holders: [{
                            name: 'Peter'
                        }]
                    }]
                }, {
                    include: [{
                        model: Holding,
                        as: 'holdings',
                        include: [{
                            model: Parcel,
                            as: 'parcels'
                        }, {
                            model: Person,
                            as: 'holders'
                        }]

                    }]
                })
                .then(function(state) {
                    this.state = state;
                    return state.groupShares()
                })
                .then(function(groups) {
                    groups.should.containSubset({
                        'A': [{
                            amount: 10,
                            shareClass: 'A'
                        }, {
                            amount: 1,
                            shareClass: 'A'
                        }],
                        'B': [{
                            amount: 1,
                            shareClass: 'B'
                        }, {
                            amount: 1,
                            shareClass: 'B'
                        }, {
                            amount: 10,
                            shareClass: 'B'
                        }],
                        'C': [{
                            amount: 1,
                            shareClass: 'C'
                        }]
                    })
                    return this.state.groupTotals();
                })
                .then(function(groupTotals){
                    groupTotals.should.containSubset({
                        'A': {amount: 11},
                        'B': {amount: 12},
                        'C': {amount: 1}
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
                holdings: [{
                    parcels: [{
                        amount: 10,
                        shareClass: 'A'
                    }, {
                        amount: 1,
                        shareClass: 'B'
                    }],
                    holders: [{
                        name: 'Simon Slimjim'
                    }]
                }]
            }, {include: [{
                        model: Holding,
                        as: 'holdings',
                        include: [{
                            model: Parcel,
                            as: 'parcels'
                        }, {
                            model: Person,
                            as: 'holders'
                        }]
                }]})
            .then(function(state){
                this.first_state = state;
                return state.buildNext({ type: Transaction.types.SEED});
            })
            .then(function(second_state){
                this.second_state = second_state;
                return second_state.getHoldings({include: [{ all: true }]})
            })
            .then(function(){
                this.first_state.holdings.length.should.be.eql(1);
                this.second_state.holdings.length.should.be.eql(1);
                this.first_state.holdings[0].parcels.length.should.be.eql(2);
                this.second_state.holdings[0].parcels.length.should.be.eql(2);
                this.first_state.id.should.not.eql(this.second_state.id)
                var first_tran_share_a = _.find(this.first_state.holdings[0].parcels, {shareClass: 'A'});
                var first_tran_share_b = _.find(this.first_state.holdings[0].parcels, {shareClass: 'B'});
                var second_tran_share_a = _.find(this.second_state.holdings[0].parcels, {shareClass: 'A'});
                var second_tran_share_b = _.find(this.second_state.holdings[0].parcels, {shareClass: 'B'});
                first_tran_share_a.amount.should.be.eql(10);
                second_tran_share_a.amount.should.be.eql(10);
                first_tran_share_a.id.should.be.eql(second_tran_share_a.id);
                first_tran_share_b.amount.should.be.eql(1);
                second_tran_share_b.amount.should.be.eql(1);
                first_tran_share_b.id.should.be.eql(second_tran_share_b.id);
                this.first_state.holdings[0].holders.length.should.be.eql(1);
                this.second_state.holdings[0].holders.length.should.be.eql(1);
                this.first_state.holdings[0].holders[0].id.should.be.eql(
                    this.second_state.holdings[0].holders[0].id);
                this.first_state.holdings[0].holders[0].personId.should.be.eql(
                    this.second_state.holdings[0].holders[0].personId);

                done();
            });
        });
        it('should add some unallocated shares', function(done){
            CompanyState.create({
                companyName: 'hax',
                holdings: [{
                    parcels: [{
                        amount: 10,
                        shareClass: 'A'
                    }],
                    holders: [{
                        name: 'Randy'
                    }]
                }],
                unallocatedParcels: [
                    {
                        amount: 100,
                        shareClass: 'A'
                    }]
            }, {include: [{
                        model: Holding,
                        as: 'holdings',
                        include: [{
                            model: Parcel,
                            as: 'parcels'
                        }, {
                            model: Person,
                            as: 'holders'
                        }]
                }, {
                    model: Parcel,
                    as: 'unallocatedParcels'
                }]})
                .then(function(state){
                    state.totalAllocatedShares().should.eventually.become(10);
                    state.totalUnallocatedShares().should.eventually.become(100)
                        .notify(done)

                })
        })
    });
    describe('Basic transformations of company state', function() {
        var initialState = {
                companyName: 'Party Sisters',
                holdings: [{
                    name: 'Allocation 1',
                    parcels: [{
                        amount: 10,
                        shareClass: 'A'
                    }, {
                        amount: 1,
                        shareClass: 'B'
                    }],
                    holders: [{
                        name: 'Sally Slimjim'
                    },{
                        name: 'Mickey Twofists'
                    }]
                }, {
                    name: 'Allocation 2',
                    parcels: [{
                        amount: 1,
                        shareClass: 'A'
                    }, {
                        amount: 1,
                        shareClass: 'B'
                    }],
                    holders: [{
                        name: 'Mickey Twofists'
                    }, {
                        name: 'Johansen McKenzie'
                    }]
                }]
            };

        it('populates company state and confirms person deduplication and associations', function(done){
            CompanyState.createDedup(initialState)
                .then(function(companyState){
                    var firstMicky = _.find(companyState.holdings[0].holders, {name: 'Mickey Twofists'});
                    var secondMicky = _.find(companyState.holdings[1].holders, {name: 'Mickey Twofists'});
                    firstMicky.dataValues.should.be.deep.equal(secondMicky.dataValues);
                    return firstMicky.getHoldings()
                })
                .then(function(holdings){
                    holdings.length.should.be.equal(2);
                    var firstAlloc = _.find(holdings, {name: 'Allocation 1'});
                    return firstAlloc.getParcels()
                })
                .then(function(parcels){
                    parcels.length.should.be.equal(2);
                    _.find(parcels, {amount: 10}).shareClass.should.be.equal('A');
                    done();
                });
        });
    });
});