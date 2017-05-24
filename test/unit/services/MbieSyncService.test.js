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

    describe('Merges IDs in 3048297', function(){
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