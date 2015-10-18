var Promise = require("bluebird");
var request = require("supertest-as-promised");
var fs = Promise.promisifyAll(require("fs"));

describe('Company Controller', function() {

    describe('Should perform validation', function() {

        var req, company_id;
        it('should login successfully', function(done) {
            req = request.agent(sails.hooks.http.app);
            req
                .post('/auth/local')
                .send({'identifier': 'companycreator@email.com', 'password': 'testtest'})
                .expect(200, done)
        });

        it('Tries to create invalid companies', function(done) {
            req.post('/api/company')
                .send({'name': 'Weyland-Yutani'})
                .expect(500)
                .then(function(res){
                    done();
                })
        });

        it('Tries to create valid company', function(done) {
            req.post('/api/company')
                .send({'companyName': 'Weyland-Yutani'})
                .expect(201)
                .then(function(res){
                    company_id = res.body.id;
                    done();
                })
        });

       /* it('Tries to add invalid holding to company', function(done) {
            req.post('/api/company/'+company_id+'/shareholdings')
                .send({})
                .expect(500)
                .then(function(res){
                    console.log(res.body)
                    done();
                })
        });*/

    })
});