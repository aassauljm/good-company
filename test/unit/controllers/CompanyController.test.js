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

    describe('Test import from companies office (PRICEMAKER LIMITED)', function(){
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
    });

    describe('Test import from companies office, pew holdings', function(){
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
        it('Try again, gets an error that company already exists for this user', function(done){
            req.post('/api/company/import/companiesoffice/239639')
                .expect(400)
                .then(function(res){
                    done();
                });
        });
        it('Renames company', function(done){
            req.post('/api/transaction/details/'+companyId)
                .send({companyName: 'Pew whammerings', companyNumber: '666'})
                .expect(200, done)
        });
        it('Does a successful stubbed import without history', function(done){
            req.post('/api/company/import/companiesoffice/239639')
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

    describe('Test import from companies office, private health care limited ', function(){
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

    describe('Test import from companies office (AROA BIOSURGERY LIMITED (1980577))', function(){
        var req, companyId;
        it('should login successfully', function(done) {
            req = request.agent(sails.hooks.http.app);
            login(req).then(done);
        });
        it('Does a stubbed import', function(done){
            req.post('/api/company/import/companiesoffice/1980577')
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
                    res.body.companyState.directorList.directors.length.should.be.equal(2);
                    done();
                });
        });
    });
    describe('Test import and share apply (AVELEY COMPANY LIMITED)', function(){
        var req, companyId, classes, holdings;
        it('should login successfully', function(done) {
            req = request.agent(sails.hooks.http.app);
            login(req).then(done);
        });
        it('Does a stubbed import (AVELEY COMPANY LIMITED)', function(done){
            req.post('/api/company/import/companiesoffice/236860')
                .expect(200)
                .then(function(res){
                    companyId = res.body.id;
                    done();
                });
        });

       it('Creates share classes', function(done){
            req.post('/api/company/'+companyId+'/share_classes/create')
                .send({json: JSON.stringify({name: 'Class A'})})
                .then(function(res){
                    return req.post('/api/company/'+companyId+'/share_classes/create')
                        .send({json: JSON.stringify({name: 'Class B'})})
                })
                .then(function(){
                    done();
                })
        });
        it('Gets current stats', function(done){
            req.get('/api/company/'+companyId+'/get_info')
                .expect(200)
                .then(function(res){
                    res.body.currentCompanyState.totalShares.should.be.equal(124000);
                    classes = _.reduce(res.body.currentCompanyState.shareClasses.shareClasses, (acc, item, key) => {
                        acc[item.name] = item.id;
                        return acc;
                    }, {});
                    holdings = _.reduce(res.body.currentCompanyState.holdingList.holdings, (acc, holding, key) => {
                        acc[holding.name] = holding.holdingId;
                        return acc;
                    }, {});
                    done();
                });
        });

        it('Applies history', function(done){
            req.post('/api/transaction/apply_share_classes/'+companyId)
                .send({actions: [{
                        transactionType: 'APPLY_SHARE_CLASS',
                        shareClass: classes['Class A'],
                        holdingId: holdings['Allocation 1']
                    },{
                        transactionType: 'APPLY_SHARE_CLASS',
                        shareClass: classes['Class B'],
                        holdingId: holdings['Allocation 2']
                    },{
                        transactionType: 'APPLY_SHARE_CLASS',
                        shareClass: classes['Class B'],
                        holdingId: holdings['Allocation 3']
                    }]
                })
                .expect(200)
                .then(function(res){
                    done();
                });
            });
        it('Gets previous version', function(done){
            req.get('/api/company/'+companyId+'/history/10')
                .expect(200)
                .then(function(res){
                    //console.log(JSON.stringify(res.body.companyState, null, 4));
                    done();
                });
        });
    });
});