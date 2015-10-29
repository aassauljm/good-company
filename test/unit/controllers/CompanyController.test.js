var Promise = require("bluebird");
var request = require("supertest-as-promised");
var fs = Promise.promisifyAll(require("fs"));

describe('Company Controller', function() {
    var req;

    describe('Should perform validation', function() {
        var companyId;
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
                    companyId = res.body.id;
                    done();
                })
        });
    });

    describe('Test import from companies office', function(){
        var companyId;
        it('Does a stubbed import', function(done){
            req.post('/api/company/import/companiesoffice/2109736')
                .expect(200)
                .then(function(res){
                    companyId = res.body.id;
                    done();
                });
        });
        it('Gets current stats', function(done){
            req.get('/api/company/'+companyId+'/get_info')
                .expect(200)
                .then(function(res){
                    res.body.totalShares.should.be.equal(2719492);
                    done();
                });
        });
    });
});