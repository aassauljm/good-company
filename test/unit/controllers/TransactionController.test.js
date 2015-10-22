var request = require("supertest-as-promised");
var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));


describe('TransactionController', function() {

    var req, companyId, firstSummary, secondSummary;
    describe('Gets needed info', function() {
        it('should login successfully', function(done) {
            req = request.agent(sails.hooks.http.app);
            req
                .post('/auth/local')
                .send({'identifier': 'transactor@email.com', 'password': 'testtest'})
                .expect(200, done)
        });
        it('should get company id', function(done) {
            req
                .get('/api/company')
                .expect(200)
                .then(function(res){
                    companyId = _.find(res.body, {companyName: 'Transaction Ltd'}).id;
                    companyId.should.be.a('number')
                    done();
                })
        });
    });
    describe('Fails Seed Transaction', function() {
        it('Try someone elses company', function(done) {
            req.post('/api/transaction/seed/'+(companyId-1))
                .expect(403, done)
        });
        it('Try empty post', function(done) {
            req.post('/api/transaction/seed/'+companyId)
                .send({})
                .expect(500, done)
        });
        it('Try no holders', function(done) {
            req.post('/api/transaction/seed/'+companyId)
                .send({holders: [{name: 'Gary'}, {name: 'Busey'}]})
                .expect(500, done)
        });
        it('Try no parcels', function(done) {
            req.post('/api/transaction/seed/'+companyId)
                .send({parcels: [{amount: 1111}]})
                .expect(500, done)
        });
    });
    describe('Successful Seed Transaction', function() {
        it('Try valid post', function(done) {
            req.post('/api/transaction/seed/'+companyId)
                .send({holdings: [{
                    holders: [{name: 'Gary'}, {name: 'Busey'}],
                    parcels: [{amount: 1111, shareClass: 'A'},
                        {amount: 1, shareClass: 'B'},
                        {amount: 10, shareClass: 'D'}]
                }]})
                .expect(200, done)
        });
        it('Get Updated Info', function(done) {
            req.get('/api/company/'+companyId+'/get_info')
                .expect(200)
                .then(function(res){
                    firstSummary = res.body;
                    firstSummary.totalAllocatedShares.should.be.equal(1122)
                    firstSummary.currentTransaction.should.containSubset({
                        type: 'SEED',
                        holdings: [
                            {
                                holders: [{name: 'Busey'}, {name: 'Gary'}],
                                parcels: [{amount: 1111, shareClass: 'A'}, {amount: 1, shareClass: 'B'}]
                            }
                        ]
                    })
                    done();
                })
        });
    });
    describe('Invalid Issue Transaction', function() {
        it('Try invalid Issue post, no parcels or holders', function(done) {
            req.post('/api/transaction/issue/'+companyId)
                .send({holdings: [{
                    holders: [],
                    parcels: []
                }]})
                .expect(500, done)
        });
        it('Try invalid Issue post, no holders', function(done) {
            req.post('/api/transaction/issue/'+companyId)
                .send({holdings: [{
                    holders: [],
                    parcels: [{amount: 10, shareClass: 'x'}]
                }]})
                .expect(500, done)
        });
        it('Try invalid Issue post, negative amount', function(done) {
            req.post('/api/transaction/issue/'+companyId)
                .send({holdings: [{
                    holders: [{name: 'Negato'}],
                    parcels: [{amount: -10, shareClass: 'x'}]
                }]})
                .expect(500, done)
        });
        it('Try invalid Issue post, zero amount', function(done) {
            req.post('/api/transaction/issue/'+companyId)
                .send({holdings: [{
                    holders: [{name: 'Nillema'}],
                    parcels: [{amount: 0, shareClass: 'x'}]
                }]})
                .expect(500, done)
        });
    });

    describe('Issue Transaction', function() {
        it('Try Valid Issue Post', function(done) {
            req.post('/api/transaction/issue/'+companyId)
                .send({holdings: [{
                    holders: [{name: 'Gary'}, {name: 'Busey'}],
                    parcels: [{amount: 100, shareClass: 'B'},{amount: 2, shareClass: 'A'},{amount: 1, shareClass: 'C'}]
                },{
                    holders: [{name: 'Santa'}],
                    parcels: [{amount: 100, shareClass: 'B'}]
                }]})
                .expect(200, done)
        });
        it('Get Updated Info', function(done) {
            req.get('/api/company/'+companyId+'/get_info')
                .expect(200)
                .then(function(res){
                    secondSummary = res.body;
                    res.body.totalAllocatedShares.should.be.equal(1325)
                    res.body.currentTransaction.should.containSubset({
                        type: 'ISSUE',
                        holdings: [
                            {
                                holders: [{name: 'Busey'}, {name: 'Gary'}],
                                parcels: [{amount: 1113, shareClass: 'A'}, {amount: 101, shareClass: 'B'},{amount: 1, shareClass: 'C'}]
                            },
                            {
                                holders: [{name: 'Santa'}],
                                parcels: [{amount: 100, shareClass: 'B'}]
                            }
                        ]
                    })
                    done();
                })
        });
        it('Get Should have different parcel ids for A,B classes, same for D', function(done) {
            var firstHolding = firstSummary.currentTransaction.holdings[0].parcels;
            var secondHolding = _.find(secondSummary.currentTransaction.holdings, function(s){
                return s.holders.length === 2;
            }).parcels;
            _.findWhere(firstHolding, {shareClass: 'A'}).id.should.be.not.eql(_.findWhere(secondHolding, {shareClass: 'A'}).id)
            _.findWhere(firstHolding, {shareClass: 'B'}).id.should.be.not.eql(_.findWhere(secondHolding, {shareClass: 'B'}).id)
            _.findWhere(firstHolding, {shareClass: 'D'}).id.should.be.eql(_.findWhere(secondHolding, {shareClass: 'D'}).id)
            done();
        });
    });
    describe('Get Previous Version', function(){
        it('should get and compare seed version', function(done){
            req.get('/api/company/'+companyId+'/history/1')
                .then(function(res){
                    _.omitDeep(res.body.transaction, 'updatedAt').should.be.deep.eql(_.omitDeep(firstSummary.currentTransaction, 'updatedAt'));
                    done();
                });
        });
    })
    describe('Another Issue Transaction', function(){
        it('Try Valid Issue Post', function(done) {
            req.post('/api/transaction/issue/'+companyId)
                .send({holdings: [{
                    holders: [{name: 'Santa'}],
                    parcels: [{amount: 1000, shareClass: 'B'}]
                }]})
                .expect(200, done)
        });
        it('Get Updated Info', function(done) {
            req.get('/api/company/'+companyId+'/get_info')
                .expect(200)
                .then(function(res){
                    res.body.totalAllocatedShares.should.be.equal(2325)
                    res.body.currentTransaction.should.containSubset({
                        type: 'ISSUE',
                        holdings: [
                            {
                                holders: [{name: 'Busey'}, {name: 'Gary'}],
                                parcels: [{amount: 1113, shareClass: 'A'}, {amount: 101, shareClass: 'B'},{amount: 1, shareClass: 'C'}]
                            },
                            {
                                holders: [{name: 'Santa'}],
                                parcels: [{amount: 1100, shareClass: 'B'}]
                            }
                        ]
                    })
                    done();
                })
        });

    });
    describe('Get Previous Versions Again', function(){
        it('should get and compare seed version', function(done){
            req.get('/api/company/'+companyId+'/history/2')
                .then(function(res){
                    _.omitDeep(res.body.transaction, 'updatedAt').should.be.deep.eql(_.omitDeep(firstSummary.currentTransaction, 'updatedAt'));
                    done();
                });
        });
        it('should get and compare first issue version', function(done){
            req.get('/api/company/'+companyId+'/history/1')
                .then(function(res){
                    _.omitDeep(res.body.transaction, 'updatedAt').should.be.deep.eql(_.omitDeep(secondSummary.currentTransaction, 'updatedAt'));
                    done();
                });
        });
    })
});