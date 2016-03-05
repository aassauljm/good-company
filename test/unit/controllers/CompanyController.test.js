var Promise = require("bluebird");
var request = require("supertest-as-promised");
var fs = Promise.promisifyAll(require("fs"));

var login = function(req){
    return req
        .post('/auth/local')
        .send({'identifier': 'companycreator@email.com', 'password': 'testtest'})
        .expect(200)
        .then(function(){
            return;
        })
}


describe('Company Controller', function() {

    describe('Should perform validation', function() {
        var req, companyId;
        it('should login successfully', function(done) {
            req = request.agent(sails.hooks.http.app);
            login(req).then(done);
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
        var req, companyId;
        it('should login successfully', function(done) {
            req = request.agent(sails.hooks.http.app);
            login(req).then(done);
        });
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
                    res.body.currentCompanyState.totalShares.should.be.equal(2719492);
                    done();
                });
        });
        it('Gets an error that company already exists for this user', function(done){
            req.post('/api/company/import/companiesoffice/2109736')
                .expect(400)
                .then(function(res){
                    done();
                });
        });
        it('Renames company', function(done){
            req.post('/api/transaction/details/'+companyId)
                .send({companyName: 'Pricewanker Limited', companyNumber: '666'})
                .expect(200, done)
        });
        it('Does a successful stubbed import without history', function(done){
            req.post('/api/company/import/companiesoffice/2109736')
                .send({history: false})
                .expect(200)
                .then(function(res){
                    companyId = res.body.id;
                    done();
                })
        });
        it('Confirms no history is present', function(done){
            req.get('/api/company/'+companyId+'/history/1')
                .expect(400, done);
        });
    });

    describe.skip('Test import from companies office, pew holdings', function(){
        var req, companyId;
        it('should login successfully', function(done) {
            req = request.agent(sails.hooks.http.app);
            login(req).then(done);
        });
        it('Does a stubbed import', function(done){
            req.post('/api/company/import/companiesoffice/239639')
                .expect(200)
                .then(function(res){
                    companyId = res.body.id;
                    done();
                });
        });
    });

    describe.skip('Test import from companies office, private health care limited ', function(){
        var req, companyId;
        it('should login successfully', function(done) {
            req = request.agent(sails.hooks.http.app);
            login(req).then(done);
        });
        it('Does a stubbed import', function(done){
            req.post('/api/company/import/companiesoffice/547018')
                .expect(200)
                .then(function(res){
                    companyId = res.body.id;
                    done();
                });
        });
    });

    describe('Test import and previous state', function(){
        var req, companyId;
        it('should login successfully', function(done) {
            req = request.agent(sails.hooks.http.app);
            login(req).then(done);
        });
        it('Does a stubbed import', function(done){
            req.post('/api/company/import/companiesoffice/3523392')
                .expect(200)
                .then(function(res){
                    companyId = res.body.id;
                    done();
                });
        });
        it('Does gets previous version', function(done){
            req.get('/api/company/'+companyId+'/history/2')
                .expect(200)
                .then(function(res){
                    res.body.companyState.companyName.should.be.equal('TESTED ON CHILDREN LIMITED');
                    res.body.companyState.directorsList.directors.length.should.be.equal(2);
                    done();
                });
        });
    });
});