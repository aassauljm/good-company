var request = require("supertest-as-promised");
var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var moment = require("moment")

describe('CompanyStateController', function() {

    var req, companyId, firstSummary, secondSummary;
    describe('Gets needed info', function() {
        it('should login successfully', function(done) {
            req = request.agent(sails.hooks.http.app);
            req
                .post('/auth/local')
                .send({'identifier': 'transactor@email.com', 'password': 'testtest'})
                .expect(302, done)
        });
        it('should get company id', function(done) {
            req
                .get('/api/company')
                .expect(200)
                .then(function(res){
                    companyId = _.find(res.body, function(c){
                        return c.currentCompanyState.companyName === 'Transaction Ltd'
                    }).id;
                    companyId.should.be.a('number')
                    done();
                })
        });
    });
    describe('Fails Seed CompanyState', function() {
        it('Try someone elses company', function(done) {
            req.post('/api/transaction/seed/'+(companyId-1))
                .expect(403, done)
        });
        it('Try empty post', function(done) {
            req.post('/api/transaction/seed/'+companyId)
                .send({})
                .expect(500, done)
        });
        it('Try no parcels', function(done) {
            req.post('/api/transaction/seed/'+companyId)
                .send({holders: [{person: {name: 'Gary'}}, {person: {name: 'Busey'}}]})
                .expect(500, done)
        });
        it('Try no parcels', function(done) {
            req.post('/api/transaction/seed/'+companyId)
                .send({parcels: [{amount: 1111}]})
                .expect(500, done)
        });
    });
    describe('Successful Seed CompanyState', function() {
        it('Try valid post', function(done) {
            req.post('/api/transaction/seed/'+companyId)
                .send({holdingList: {holdings: [{
                    holders: [{person: {name: 'Gary'}}, {person: {name: 'Busey'}}],
                    parcels: [{amount: 1111, shareClass: 1},
                        {amount: 1, shareClass: 2},
                        {amount: 10, shareClass: 4}]
                }]}})
                .expect(200, done)
        });
        it('Get Updated Info', function(done) {
            req.get('/api/company/'+companyId+'/get_info')
                .expect(200)
                .then(function(res){
                    firstSummary = res.body;
                    firstSummary.currentCompanyState.totalAllocatedShares.should.be.equal(1122)
                    firstSummary.currentCompanyState.should.containSubset({
                        transaction: {
                            type: 'SEED'
                        },
                        holdingList: {holdings: [
                                {
                                    holders: [{person: {name: 'Busey'}}, {person: {name: 'Gary'}}],
                                    parcels: [{amount: 1111, shareClass: 1}, {amount: 1, shareClass: 2}, {amount: 10, shareClass: 4}]
                                }
                            ]
                        }
                    })
                    done();
                })
        });
    });
    describe('Invalid Issue CompanyState', function() {
        it('Try invalid Issue post, no parcels or holders', function(done) {
            req.post('/api/transaction/issue/'+companyId)
                .send({holdingList: {holdings: [{
                    holders: [],
                    parcels: []
                }]}})
                .expect(400, done)
        });
        it('Try invalid Issue post, no holders', function(done) {
            req.post('/api/transaction/issue/'+companyId)
                .send({holdingList: {holdings: [{
                    holders: [],
                    parcels: [{amount: 10, beforeAmount: 0, afterAmount: 10}]
                }]}})
                .expect(400, done)
        });
        it('Try invalid Issue post, negative amount', function(done) {
            req.post('/api/transaction/issue/'+companyId)
                .send({holdingList: {holdings: [{
                    holders: [{name: 'Negato'}],
                    parcels: [{amount: -10, beforeAmount: 0, afterAmount: -10}]
                }]}})
                .expect(400, done)
        });
        it('Try invalid Issue post, zero amount', function(done) {
            req.post('/api/transaction/issue/'+companyId)
                .send({holdingList: {holdings: [{
                    holders: [{name: 'Nillema'}],
                    parcels: [{amount: 0, beforeAmount: 0, afterAmount: 0}]
                }]}})
                .expect(400, done)
        });
    });

    describe('Issue CompanyState', function() {
        it('Try Valid Issue Post', function(done) {
            req.post('/api/transaction/issue/'+companyId)
                .send({holdingList: {holdings: [{
                    holders: [{name: 'Gary'}, {name: 'Busey'}],
                    parcels: [
                    {amount: 100, shareClass: 2, beforeAmount: 1, afterAmount:101},
                    {amount: 2, shareClass: 1, beforeAmount: 1111, afterAmount:1113},
                    {amount: 1, shareClass: 3, beforeAmount: 0, afterAmount:1}]
                }]}})
                .expect(200, done)
        });
        it('Get Updated Info', function(done) {
            req.get('/api/company/'+companyId+'/get_info')
                .expect(200)
                .then(function(res){
                    secondSummary = res.body;
                    res.body.currentCompanyState.totalAllocatedShares.should.be.equal(1225)
                    res.body.currentCompanyState.should.containSubset({
                        transaction: {
                            type: 'COMPOUND'
                        },
                        holdingList: {holdings: [
                            {
                                holders: [{person: {name: 'Busey'}}, {person: {name: 'Gary'}}],
                                parcels: [{amount: 1113, shareClass: 1}, {amount: 101, shareClass: 2},{amount: 1, shareClass: 3}, {amount: 10, shareClass: 4}]
                            }
                        ]}
                    })
                    done();
                })
        });
        it('Get Should have different parcel ids for A,B classes, same for D', function(done) {
            var firstHolding = firstSummary.currentCompanyState.holdingList.holdings[0].parcels;
            var secondHolding = _.find(secondSummary.currentCompanyState.holdingList.holdings, function(s){
                return s.holders.length === 2;
            }).parcels;
            _.findWhere(firstHolding, {shareClass: 1}).id.should.be.not.eql(_.findWhere(secondHolding, {shareClass: 1}).id)
            _.findWhere(firstHolding, {shareClass: 2}).id.should.be.not.eql(_.findWhere(secondHolding, {shareClass: 2}).id)
            _.findWhere(firstHolding, {shareClass: 4}).id.should.be.eql(_.findWhere(secondHolding, {shareClass: 4}).id)
            done();
        });
    });

    describe('Get Previous Version', function(){
        it('should get and compare seed version', function(done){
            req.get('/api/company/'+companyId+'/history/3')
                .then(function(res){
                    _.omitDeep(res.body.companyState, 'updatedAt', 'futureTransactions').should.be.deep.eql(_.omitDeep(firstSummary.currentCompanyState, 'updatedAt', 'futureTransactions'));
                    done();
                });
        });
    });

    describe('Another Issue CompanyState', function(){
        it('Try Valid Issue Post', function(done) {
            req.post('/api/transaction/issue/'+companyId)
                .send({holdingList: {holdings: [{
                    holders: [{name: 'Busey'}, {name: 'Gary'}],
                    parcels: [{amount: 1100, shareClass: 2, beforeAmount: 101, afterAmount:1201}]
                }]}})
                .expect(200, done)
        });
        it('Get Updated Info', function(done) {
            req.get('/api/company/'+companyId+'/get_info')
                .expect(200)
                .then(function(res){
                    res.body.currentCompanyState.totalAllocatedShares.should.be.equal(2325);
                    res.body.currentCompanyState.should.containSubset({
                        transaction: {
                            type: 'COMPOUND'
                        },
                        holdingList: { holdings: [
                            {
                                holders: [{person: {name: 'Busey'}}, {person: {name: 'Gary'}}],
                                parcels: [{amount: 1113, shareClass: 1}, {amount: 1201, shareClass: 2},{amount: 1, shareClass: 3}]
                            }
                        ] }
                    });
                    done();
                });
        });
    });

    describe('Get Previous Versions Again', function(){
        it('should get and compare seed version', function(done){
            req.get('/api/company/'+companyId+'/history/4')
                .then(function(res){
                    _.omitDeep(res.body.companyState, 'updatedAt', 'futureTransactions').should.be.deep.eql(_.omitDeep(firstSummary.currentCompanyState, 'updatedAt', 'futureTransactions'));
                    done();
                });
        });
        it('should get and compare first issue version', function(done){
            req.get('/api/company/'+companyId+'/history/1')
                .then(function(res){
                    _.omitDeep(res.body.companyState, 'updatedAt', 'futureTransactions').should.be.deep.eql(_.omitDeep(secondSummary.currentCompanyState, 'updatedAt', 'futureTransactions'));
                    done();
                });
        });
    });

    describe('Update company info', function(){
        it('Update name', function(done) {
            req.post('/api/transaction/details/'+companyId)
                .send({companyName: 'Transaction Limited'})
                .expect(200, done)
        });
        it('Get Updated Info', function(done) {
            req.get('/api/company/'+companyId+'/get_info')
                .expect(200)
                .then(function(res){
                    res.body.currentCompanyState.companyName.should.be.equal('Transaction Limited');
                    done();
                });
            });
    });

    describe('Allocation Removal', function(){
        it('should be rejected for being non empty', function(done) {
           req.post('/api/transaction/compound/'+companyId)
                .send({transactions: [{
                    actions: [{ transactionType: Transaction.types.REMOVE_ALLOCATION, holders: [{name: 'Gary'}, {name: 'Busey'}] }]}
                    ]})
                .expect(400, done)
        });
    });

    describe('Transfer shares', function(){
        let holdingId, currentAmount;
        it('Gets info for holding', function(done) {
           req.get('/api/company/'+companyId+'/get_info')
                .expect(200)
                .then(function(res){
                    holdingId = res.body.currentCompanyState.holdingList.holdings[0].holdingId;
                    currentAmount = res.body.currentCompanyState.holdingList.holdings[0].parcels.filter(p => p.shareClass === 1)[0].amount;
                    done();
                });
        });
        it('Creates new allocation and transfers to it', function(done) {
            req.post('/api/transaction/compound/'+companyId)
                .send({transactions: [
                    {
                        actions: [{
                            transactionType: Transaction.types.NEW_ALLOCATION,
                            holders: [{name: 'Jim'}]
                        },
                        {
                            transactionType: Transaction.types.TRANSFER_FROM,
                            transactionMethod: Transaction.types.AMEND,
                            amount: 1,
                            beforeAmount: currentAmount,
                            afterAmount: currentAmount - 1,
                            shareClass: 1,
                            holdingId: holdingId
                        },
                        {
                            transactionType: Transaction.types.TRANSFER_TO,
                            transactionMethod: Transaction.types.AMEND,
                            amount: 1,
                            beforeAmount: 0,
                            afterAmount: 1,
                            shareClass: 1,
                            holders: [{name: 'Jim'}]
                        }]
                    }
                ]})
                .expect(200, done)
            });
        it('Get Updated Info', function(done) {
            req.get('/api/company/'+companyId+'/get_info')
                .expect(200)
                .then(function(res){
                    res.body.currentCompanyState.totalAllocatedShares.should.be.equal(2325);
                    res.body.currentCompanyState.should.containSubset({
                        transaction: {
                            type: 'COMPOUND'
                        },
                        holdingList: { holdings: [
                            {
                                holders: [{person: {name: 'Busey'}}, {person: {name: 'Gary'}}],
                                parcels: [{amount: 1112, shareClass: 1}, {amount: 1201, shareClass: 2},{amount: 1, shareClass: 3}]
                            },
                            {
                                holders: [{person: {name: 'Jim'}}],
                                parcels: [{amount: 1, shareClass: 1}]
                            }
                        ] }
                    });
                    done();
                });
        });
        it('It transfers back', function(done) {
            req.post('/api/transaction/compound/'+companyId)
                .send({transactions: [
                    {
                        actions: [
                        {
                            transactionType: Transaction.types.TRANSFER_TO,
                            transactionMethod: Transaction.types.AMEND,
                            amount: 1,
                            beforeAmount: currentAmount-1,
                            afterAmount: currentAmount,
                            shareClass: 1,
                            holdingId: holdingId
                        },
                        {
                            transactionType: Transaction.types.TRANSFER_FROM,
                            transactionMethod: Transaction.types.AMEND,
                            amount: 1,
                            beforeAmount: 1,
                            afterAmount: 0,
                            shareClass: 1,
                            holders: [{name: 'Jim'}]
                        }]
                    }
                ]})
                .expect(200, done)
        });
        it('Expects new allocation to be removed', function(done) {
            req.get('/api/company/'+companyId+'/get_info')
                .expect(200)
                .then(function(res){
                    res.body.currentCompanyState.totalAllocatedShares.should.be.equal(2325);
                    res.body.currentCompanyState.should.containSubset({
                        holdingList: { holdings: [
                            {
                                holders: [{person: {name: 'Busey'}}, {person: {name: 'Gary'}}],
                                parcels: [{amount: 1113, shareClass: 1}, {amount: 1201, shareClass: 2},{amount: 1, shareClass: 3}]
                            }
                        ] }
                    });
                    res.body.currentCompanyState.holdingList.holdings.length.should.be.equal(1);
                    done();
                });
        });
    });
});



describe('Future Transactions', function(){
    let companyId, req;

    it('should login successfully', function(done) {
        req = request.agent(sails.hooks.http.app);
        req
            .post('/auth/local')
            .send({'identifier': 'transactor@email.com', 'password': 'testtest'})
            .expect(302, done)
    });
    it('should get company id', function(done) {
        req
            .get('/api/company')
            .expect(200)
            .then(function(res){
                companyId = _.find(res.body, function(c){
                    return c.currentCompanyState.companyName === 'Futures Ltd'
                }).id;
                companyId.should.be.a('number')
                done();
            })
    });
    it('Seeds', function(done) {
        req.post('/api/transaction/seed/'+companyId)
            .send({holdingList: {holdings: [{
                holders: [{person: {name: 'Gary'}}, {person: {name: 'Busey'}}],
                parcels: [{amount: 1111, shareClass: 1},
                    {amount: 1, shareClass: 2},
                    {amount: 10, shareClass: 4}]
            }]}})
            .expect(200, done)
    });
    it('Updates name', function(done) {
        req.post('/api/transaction/compound/'+companyId)
            .send({transactions: [
                {
                    effectiveDate: new Date(),
                    actions: [{
                        transactionType: 'NAME_CHANGE',
                        previousCompanyName: 'Futures Ltd',
                        newCompanyName: 'Futures Limited'
                    }]
                }
            ]})
            .expect(200, done)
        });

    it('Gets new company state', function(done) {
       req.get('/api/company/'+companyId+'/get_info')
            .expect(200)
            .then(function(res){
                res.body.currentCompanyState.companyName.should.be.equal('Futures Limited');
                done();
            });
    });

    it('Updates name in the future', function(done) {
        req.post('/api/transaction/compound/'+companyId)
            .send({transactions: [
                {
                    effectiveDate: moment().add('10', 'day').toDate(),
                    actions: [{
                        transactionType: 'NAME_CHANGE',
                        previousCompanyName: 'Futures Limited',
                        newCompanyName: 'Futures Unlimited'
                    }]
                }
            ]})
            .expect(200, done)
        });

    it('Checks that compamy name has not updated now', function(done) {
       req.get('/api/company/'+companyId+'/get_info')
            .expect(200)
            .then(function(res){
                res.body.currentCompanyState.companyName.should.be.equal('Futures Limited');
                res.body.currentCompanyState.futureTransactions.length.should.be.equal(1);
                done();
            });
    });

    it('Updates name in the future again', function(done) {
        req.post('/api/transaction/compound/'+companyId)
            .send({transactions: [
                {
                    effectiveDate: moment().add('11', 'day').toDate(),
                    actions: [{
                        transactionType: 'NAME_CHANGE',
                        previousCompanyName: 'Futures Unlimited',
                        newCompanyName: 'Futures Explosionfest'
                    }]
                }
            ]})
            .expect(200, done)
        });

    it('Checks that compamy name has not updated now, but has 2 futureTransactions', function(done) {
       req.get('/api/company/'+companyId+'/get_info')
            .expect(200)
            .then(function(res){
                res.body.currentCompanyState.companyName.should.be.equal('Futures Limited');
                res.body.currentCompanyState.futureTransactions.length.should.be.equal(2);
                done();
            });
    });

    it('Updates name in the future, but before other transactions', function(done) {
        req.post('/api/transaction/compound/'+companyId)
            .send({transactions: [
                {
                    effectiveDate: moment().add('9', 'day').toDate(),
                    actions: [{
                        transactionType: 'NAME_CHANGE',
                        previousCompanyName: 'Futures Limited',
                        newCompanyName: 'Futures Relimited'
                    }]
                }
            ]})
            .expect(500)
            .then(function(res) {
                done();
            })
        });

    it('Does an issue in the future, but will not conflict', function(done) {
        const date = moment().add('7');
        req.post('/api/transaction/compound/'+companyId)
                .send({
                    "transactions": [
                        {
                            "actions": [
                                {
                                    "amount": 1,
                                    "effectiveDate": date,
                                    "shareClass": null,
                                    "transactionType": "ISSUE"
                                },
                                {
                                    "afterAmount": 1,
                                    "amount": 1,
                                    "effectiveDate": date,
                                    "approvalDocuments": [],
                                    "beforeAmount": 0,
                                    holders: [{name: 'Gary'}, {name: 'Busey'}],
                                    "minNotice": null,
                                    "shareClass": null,
                                    "transactionMethod": "AMEND",
                                    "transactionType": "ISSUE_TO"
                                }
                            ],
                            "effectiveDate": date,
                            "transactionType": "ISSUE"
                        }

                    ]
            })
            .expect(200, done)
        });
    it('Checks that shares not updated now', function(done) {
       req.get('/api/company/'+companyId+'/get_info')
            .expect(200)
            .then(function(res){
                res.body.currentCompanyState.companyName.should.be.equal('Futures Limited');
                res.body.currentCompanyState.totalShares.should.be.equal(1122)
                res.body.currentCompanyState.futureTransactions.length.should.be.equal(3);
                done();
            });
    });
});

