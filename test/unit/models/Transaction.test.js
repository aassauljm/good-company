describe('Transaction Model', function() {
    describe('Create Transaction Holdings', function() {

        it('should calculate holding totals', function(done) {
            Transaction.create({
                    type: Transaction.types.SEED,
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
                            model: Holder,
                            as: 'holders'
                        }]

                    }]
                })
                .then(function(transaction) {
                    this.transaction = transaction;
                    return transaction.groupShares()
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
                    return this.transaction.groupTotals();
                })
                .then(function(groupTotals){
                    groupTotals.should.containSubset({
                        'A': {amount: 11},
                        'B': {amount: 12},
                        'C': {amount: 1}
                    });
                    return this.transaction.totalShares();
                })
                .then(function(totalShares){
                    totalShares.should.be.eql(24)
                    done();
                });
        });
        it('should clone holdings', function(done) {
            Transaction.create({
                type: Transaction.types.SEED,
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
                            model: Holder,
                            as: 'holders'
                        }]
                }]})
            .then(function(transaction){
                this.first_transaction = transaction;
                return transaction.buildNext({ type: Transaction.types.SEED});
            })
            .then(function(second_transaction){
                this.second_transaction = second_transaction;
                return second_transaction.getHoldings({include: [{ all: true }]})
            })
            .then(function(){
                this.first_transaction.holdings.length.should.be.eql(1);
                this.second_transaction.holdings.length.should.be.eql(1);
                this.first_transaction.holdings[0].parcels.length.should.be.eql(2);
                this.second_transaction.holdings[0].parcels.length.should.be.eql(2);
                this.first_transaction.id.should.not.eql(this.second_transaction.id)
                var first_tran_share_a = _.find(this.first_transaction.holdings[0].parcels, {shareClass: 'A'});
                var first_tran_share_b = _.find(this.first_transaction.holdings[0].parcels, {shareClass: 'B'});
                var second_tran_share_a = _.find(this.second_transaction.holdings[0].parcels, {shareClass: 'A'});
                var second_tran_share_b = _.find(this.second_transaction.holdings[0].parcels, {shareClass: 'B'});
                first_tran_share_a.amount.should.be.eql(10);
                second_tran_share_a.amount.should.be.eql(10);
                first_tran_share_a.id.should.be.eql(second_tran_share_a.id);
                first_tran_share_b.amount.should.be.eql(1);
                second_tran_share_b.amount.should.be.eql(1);
                first_tran_share_b.id.should.be.eql(second_tran_share_b.id);
                this.first_transaction.holdings[0].holders.length.should.be.eql(1);
                this.second_transaction.holdings[0].holders.length.should.be.eql(1);
                this.first_transaction.holdings[0].holders[0].id.should.be.eql(
                    this.second_transaction.holdings[0].holders[0].id);
                done();
            });

        });
    });
});