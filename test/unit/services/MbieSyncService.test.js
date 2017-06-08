var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var moment = require('moment');
const cheerio = require('cheerio');
var request = require("supertest");


var login = function(req, username='companycreator@email.com'){
    return req
        .post('/auth/local')
        .send({'identifier': username, 'password': 'testtest'})
        .expect(302)
        .then(function(){
            return;
        })
}


describe('MBIE Sync Service', function() {

    describe('Merges IDs in AR TEST 1476323989359 (3048297)', function(){
        var req, companyId;
        it('should login successfully', function(done) {
            req = request.agent(sails.hooks.http.app);
            login(req).then(done);
        });
        it('Does a stubbed import', function(done){
            req.post('/api/company/import/companiesoffice/3048297')
                .expect(200)
                .then(function(res){
                    companyId = res.body.id;
                    done();
                });
        });



        it('Updates director', function(done){
            const UPDATE_DIRECTOR = {
                "documents": null,
                "transactions": [
                    {
                        "actions": [
                            {
                                "afterAddress": "19 Victoria Avenue, Morrinsville, Morrinsville, New Zealand",
                                "afterName": "Daniel CARTERAGE",
                                "beforeAddress": "19 Victoria Avenue, Morrinsville, Morrinsville, New Zealand",
                                "beforeName": "Daniel CARTER",
                                "personAttr": {},
                                "transactionType": "UPDATE_DIRECTOR"
                            }
                        ],
                        "effectiveDate": new Date(),
                        "transactionType": "UPDATE_DIRECTOR"
                    }
                ]
            };
            req.post('/api/transaction/compound/'+companyId)
                .send({json: JSON.stringify(UPDATE_DIRECTOR)})
                .expect(200)
                .then(function(res){
                    done();
                });
        });

      /*  it('Appoints director', function(done){
            const UPDATE_DIRECTOR = {
                "documents": null,
                "transactions": [
                    {
                        "actions": [
                            {
                                "afterAddress": "19 Victoria Avenue, Morrinsville, Morrinsville, New Zealand",
                                "afterName": "Daniel CARTERAGE",
                                "beforeAddress": "19 Victoria Avenue, Morrinsville, Morrinsville, New Zealand",
                                "beforeName": "Daniel CARTER",
                                "personAttr": {},
                                "transactionType": "UPDATE_DIRECTOR"
                            }
                        ],
                        "effectiveDate": new Date(),
                        "transactionType": "UPDATE_DIRECTOR"
                    }
                ]
            };
            req.post('/api/transaction/compound/'+companyId)
                .send({json: JSON.stringify(UPDATE_DIRECTOR)})
                .expect(200)
                .then(function(res){
                    done();
                });
        });*/

        it('Removes a director', function(done){
            const REMOVE_DIRECTOR = {
                "documents": null,
                "transactions": [
                    {
                        "actions": [
                            {
                                "address": "19 Victoria Avenue, Morrinsville, Morrinsville, New Zealand",
                                "name": "Daniel CARTERAGE",
                                "transactionType": "REMOVE_DIRECTOR"
                            }
                        ],
                        "effectiveDate": new Date(),
                        "transactionType": "REMOVE_DIRECTOR"
                    }
                ]
            };
            req.post('/api/transaction/compound/'+companyId)
                .send({json: JSON.stringify(REMOVE_DIRECTOR)})
                .expect(200)
                .then(function(res){
                    done();
                });
        });
        it('Merges with co', function(done){
            req.post('/api/company/'+companyId+'/merge_companies_office')
                .expect(200)
                .then(function(res){
                    done();
                });
        });


    });


    describe('Merges IDs in 2135118', function(){
        var req, companyId;
        it('should login successfully', function(done) {
            req = request.agent(sails.hooks.http.app);
            login(req).then(done);
        });
        it('Does a stubbed import', function(done){
            req.post('/api/company/import/companiesoffice/2135118')
                .expect(200)
                .then(function(res){
                    companyId = res.body.id;
                    done();
                });
        });
        it('Merges with co', function(done){
            req.post('/api/company/'+companyId+'/merge_companies_office')
                .expect(200)
                .then(function(res){
                    done();
                });
        });
    });

})