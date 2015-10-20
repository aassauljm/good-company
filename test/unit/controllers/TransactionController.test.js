var request = require("supertest-as-promised");
var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var _ = require('lodash');

describe('TransactionController', function() {

    var req, companyId;
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
        it('Try no shareholders', function(done) {
            req.post('/api/transaction/seed/'+companyId)
                .send({shareholders: [{name: 'Gary'}, {name: 'Busey'}]})
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
                .send({shareholdings: [{
                    shareholders: [{name: 'Gary'}, {name: 'Busey'}],
                    parcels: [{amount: 1111, shareClass: 'A'}, {amount: 1, shareClass: 'B'}]
                }]})
                .expect(200, done)
        });
        it('Get Updated Info', function(done) {
            req.get('/api/company/'+companyId+'/get_info')
                .expect(200)
                .then(function(res){
                    res.body.totalAllocatedShares.should.be.equal(1112)
                    res.body.currentTransaction.should.containSubset({
                        type: 'SEED',
                        shareholdings: [
                            {
                                shareholders: [{name: 'Busey'}, {name: 'Gary'}],
                                parcels: [{amount: 1111, shareClass: 'A'}, {amount: 1, shareClass: 'B'}]
                            }
                        ]
                    })
                    done();
                })
        });
    });
    describe('Invalid Issue Transaction', function() {
        it('Try invalid Issue post', function(done) {
            req.post('/api/transaction/issue/'+companyId)
                .send({shareholdings: [{
                    shareholders: [],
                    parcels: []
                }]})
                .expect(500, done)
        });
        it('Try invalid Issue post', function(done) {
            req.post('/api/transaction/issue/'+companyId)
                .send({shareholdings: [{
                    shareholders: [],
                    parcels: [{amount: 10}]
                }]})
                .expect(500, done)
        });
    });

    describe('Issue Transaction', function() {
        it('Try Valid Issue Post', function(done) {
            req.post('/api/transaction/issue/'+companyId)
                .send({shareholdings: [{
                    shareholders: [{name: 'Gary'}, {name: 'Busey'}],
                    parcels: [{amount: 100, shareClass: 'B'},{amount: 2, shareClass: 'A'},{amount: 1, shareClass: 'C'}]
                },{
                    shareholders: [{name: 'Santa'}],
                    parcels: [{amount: 100, shareClass: 'B'}]
                }]})
                .expect(200, done)
        });
        it('Get Updated Info', function(done) {
            req.get('/api/company/'+companyId+'/get_info')
                .expect(200)
                .then(function(res){
                    console.log(JSON.stringify(res.body.currentTransaction))
                    res.body.totalAllocatedShares.should.be.equal(1315)
                    res.body.currentTransaction.should.containSubset({
                        type: 'ISSUE',
                        shareholdings: [
                            {
                                shareholders: [{name: 'Busey'}, {name: 'Gary'}],
                                parcels: [{amount: 1113, shareClass: 'A'}, {amount: 101, shareClass: 'B'},{amount: 1, shareClass: 'C'}]
                            },
                            {
                                shareholders: [{name: 'Santa'}],
                                parcels: [{amount: 100, shareClass: 'B'}]
                            }
                        ]
                    })
                    done();
                })
        });
    });
});