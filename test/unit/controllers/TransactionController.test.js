var request = require("supertest-as-promised");
var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var _ = require('lodash');

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
                    console.log(JSON.stringify(firstSummary.currentTransaction));
                    firstSummary.totalAllocatedShares.should.be.equal(1122)
                    firstSummary.currentTransaction.should.containSubset({
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
                    secondSummary = res.body;
                    res.body.totalAllocatedShares.should.be.equal(1325)
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
        it('Get Should have different parcel ids for A,B classes, same for D', function(done) {
            var firstShareholding = firstSummary.currentTransaction.shareholdings[0].parcels;
            var secondShareholding = _.find(secondSummary.currentTransaction.shareholdings, function(s){
                return s.shareholders.length === 2;
            }).parcels;
            _.findWhere(firstShareholding, {shareClass: 'A'}).id.should.be.not.eql(_.findWhere(secondShareholding, {shareClass: 'A'}).id)
            _.findWhere(firstShareholding, {shareClass: 'B'}).id.should.be.not.eql(_.findWhere(secondShareholding, {shareClass: 'B'}).id)
            _.findWhere(firstShareholding, {shareClass: 'D'}).id.should.be.eql(_.findWhere(secondShareholding, {shareClass: 'D'}).id)
            done();
        });
    });
    describe('Get Previous Versions', function(){
        it('should get and compare seed version', function(done){
            req.get('/api/company/'+companyId+'/history/1')
                .then(function(res){
                    console.log(JSON.stringify(res.body.transaction))
                    console.log(JSON.stringify(firstSummary.currentTransaction))
                   // res.body.transaction.should.be.deep.eql(firstSummary.currentTransaction);
                    done();
                });
        });
    })
});