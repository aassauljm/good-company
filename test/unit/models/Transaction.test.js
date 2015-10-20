describe('Transaction Model', function() {
    describe('Create Transaction Shareholdings', function() {

        it('should calculate shareholding totals', function(done) {
            Transaction.create({
                    type: Transaction.types.SEED,
                    shareholdings: [{
                        parcels: [{
                            amount: 10,
                            shareClass: 'A'
                        }, {
                            amount: 1,
                            shareClass: 'B'
                        }],
                        shareholders: [{
                            name: 'Mike'
                        }],
                        companyId: 3
                    }, {
                        parcels: [{
                            amount: 10,
                            shareClass: 'B'
                        }, {
                            amount: 1,
                            shareClass: 'C'
                        }],
                        shareholders: [{
                            name: 'Gary'
                        }],
                        companyId: 3
                    }, {
                        parcels: [{
                            amount: 1,
                            shareClass: 'A'
                        }, {
                            amount: 1,
                            shareClass: 'B'
                        }],
                        shareholders: [{
                            name: 'Peter'
                        }],
                        companyId: 3
                    }]
                }, {
                    include: [{
                        model: Shareholding,
                        as: 'shareholdings',
                        include: [{
                            model: Parcel,
                            as: 'parcels'
                        }, {
                            model: Shareholder,
                            as: 'shareholders'
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
        it('should clone shareholdings', function(done) {
            Transaction.create({
                type: Transaction.types.SEED,
                shareholdings: [{
                    parcels: [{
                        amount: 10,
                        shareClass: 'A'
                    }, {
                        amount: 1,
                        shareClass: 'B'
                    }],
                    shareholders: [{
                        name: 'Mike'
                    }],
                    companyId: 3
                }]
            }, {include: [{
                        model: Shareholding,
                        as: 'shareholdings',
                        include: [{
                            model: Parcel,
                            as: 'parcels'
                        }, {
                            model: Shareholder,
                            as: 'shareholders'
                        }]

                    }]})
            .then(function(transaction){
                this.first_transaction = transaction;
                return transaction.cloneShareholdings()
            })
            .then(function(shareholdings){
                return Transaction.create({
                    type: Transaction.types.SEED,
                    shareholdings: shareholdings
                }, {include: [{
                        model: Shareholding,
                        as: 'shareholdings',
                        include: [{
                            model: Parcel,
                            as: 'parcels'
                        }, {
                            model: Shareholder,
                            as: 'shareholders'
                        }]
                    }]});
            })
            .then(function(second_transaction){
                this.second_transaction = second_transaction;
                return second_transaction.getShareholdings({include: [{ all: true }]})
            })
            .then(function(){
                this.first_transaction.shareholdings.length.should.be.eql(1);
                this.second_transaction.shareholdings.length.should.be.eql(1);
                this.first_transaction.shareholdings[0].parcels.length.should.be.eql(2);
                this.second_transaction.shareholdings[0].parcels.length.should.be.eql(2);
                var first_tran_share_a = _.find(this.first_transaction.shareholdings[0].parcels, {shareClass: 'A'});
                var first_tran_share_b = _.find(this.first_transaction.shareholdings[0].parcels, {shareClass: 'B'});
                var second_tran_share_a = _.find(this.second_transaction.shareholdings[0].parcels, {shareClass: 'A'});
                var second_tran_share_b = _.find(this.second_transaction.shareholdings[0].parcels, {shareClass: 'B'});
                first_tran_share_a.amount.should.be.eql(10);
                second_tran_share_a.amount.should.be.eql(10);
                first_tran_share_a.id.should.not.be.eql(second_tran_share_a.id);
                first_tran_share_b.amount.should.be.eql(1);
                second_tran_share_b.amount.should.be.eql(1);
                first_tran_share_b.id.should.not.be.eql(second_tran_share_b.id);
                this.first_transaction.shareholdings[0].shareholders.length.should.be.eql(1);
                this.second_transaction.shareholdings[0].shareholders.length.should.be.eql(1);
                this.first_transaction.shareholdings[0].shareholders[0].id.should.not.be.eql(
                    this.second_transaction.shareholdings[0].shareholders[0].id);

                done();
            });

        });
    });
});