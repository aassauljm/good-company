var Promise = require("bluebird");
var request = require("supertest-as-promised");
var fs = Promise.promisifyAll(require("fs"));
import chai from 'chai';
const should = chai.should();

var login = function(req){
    return req
        .post('/auth/local')
        .send({'identifier': 'companycreator@email.com', 'password': 'testtest'})
        .expect(302)
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
                    res.body.currentCompanyState.totalShares.should.be.equal(1654352);
                    done();
                });
        });
        it('Gets pending history', function(done){
            req.get('/api/company/'+companyId+'/pending_history')
                .expect(200)
                .then(function(res){

                    _.find(res.body, action => {
                        return action.data &&  action.data.transactionType === Transaction.types.INCORPORATION;
                    }).should.not.be.equal(null);
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
                .expect(404, done);
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
                })
                .catch(done);
        });
        it('Gets current stats', function(done){
            req.get('/api/company/'+companyId+'/get_info')
                .expect(200)
                .then(function(res){
                    done();
                })
                .catch(done);
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
                })
                .catch(done);
        });
        it('Imports history', function(done){
            req.post('/api/company/'+companyId+'/import_pending_history')
                .expect(200)
                .then(function(res){
                    done();
                })
                .catch(done);
        });
        it('Does gets previous version', function(done){
            req.get('/api/company/'+companyId+'/history/2')
                .expect(200)
                .then(function(res){
                    res.body.companyState.companyName.should.be.equal('TESTED ON CHILDREN LIMITED');
                    res.body.companyState.directorList.directors.length.should.be.equal(2);
                    done();
                })
                .catch(done);
        });
    });
    describe('Test import and share apply (AVELEY COMPANY LIMITED)', function(){
        var req, companyId, classes, holdings, initialState;
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
                .catch(done);
        });
        it('Gets current stats', function(done){
            req.get('/api/company/'+companyId+'/get_info')
                .expect(200)
                .then(function(res){
                    initialState = res.body;
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
                })
                .catch(done);
        });

        it('Applies share classes', function(done){
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
                })
                .catch(done)
            });


        it('does a person update', function(done){
            req.post('/api/transaction/compound/'+companyId)
                .send({transactions: [{actions: [{
                "transactionType": "HOLDER_CHANGE",
                "afterHolder": {
                    "name": "NEW PERSON",
                    "address": "MALLEY & CO, Level 2, 14 Dundas Street, Christchurch Central, Christchurch, New Zealand"
                },
                "beforeHolder": {
                    "name": "LYSAGHT TRUSTEES LIMITED",
                    "address": "MALLEY & CO, Level 2, 14 Dundas Street, Christchurch Central, Christchurch, New Zealand",
                    "companyNumber": "3582711"
                }}]}]})
            .expect(200)
            .then(() => req.get('/api/company/'+companyId+'/get_info'))
            .then((res) => {

                const oldHolding = _.find(initialState.currentCompanyState.holdingList.holdings, (h) => h.name === 'Allocation 3');
                const oldHolder = _.find(oldHolding.holders, h => _.isMatch(h.person, {name: 'LYSAGHT TRUSTEES LIMITED'})).person;
                const newHolding = _.find(res.body.currentCompanyState.holdingList.holdings, (h) => h.name === 'Allocation 3');
                const newHolder = _.find(newHolding.holders, h => _.isMatch(h.person, {name: 'NEW PERSON'})).person;
                oldHolder.personId.should.be.equal(newHolder.personId);
                done();
            })
        });
        it('does a person update (holder, implicit director)', function(done){
            req.post('/api/transaction/compound/'+companyId)
                .send({transactions: [{actions: [{
                "transactionType": "HOLDER_CHANGE",
                "afterHolder": {
                    "name": "Directy",
                    "address": "home"
                },
                "beforeHolder": {
                    "name": "Susan Ruth LYSAGHT",
                    "address": "28 Wairarapa Terrace, Fendalton, Christchurch, New Zealand",
                }}]}]})
            .expect(200)
            .then(() => req.get('/api/company/'+companyId+'/get_info'))
            .then((res) => {
                let oldHolding = _.find(initialState.currentCompanyState.holdingList.holdings, (h) => h.name === 'Allocation 1');
                let oldHolder = _.find(oldHolding.holders, h => _.isMatch(h.person, {name: 'Susan Ruth LYSAGHT'})).person;
                let newHolding = _.find(res.body.currentCompanyState.holdingList.holdings, (h) => h.name === 'Allocation 1');
                let newHolder = _.find(newHolding.holders, h => _.isMatch(h.person, {name: 'Directy'})).person;
                oldHolder.personId.should.be.equal(newHolder.personId);

                oldHolding = _.find(initialState.currentCompanyState.holdingList.holdings, (h) => h.name === 'Allocation 2');
                oldHolder = _.find(oldHolding.holders, h => _.isMatch(h.person, {name: 'Susan Ruth LYSAGHT'})).person;
                newHolding = _.find(res.body.currentCompanyState.holdingList.holdings, (h) => h.name === 'Allocation 2');
                newHolder = _.find(newHolding.holders, h => _.isMatch(h.person, {name: 'Directy'})).person;

                oldHolder.personId.should.be.equal(newHolder.personId);
                res.body.currentCompanyState.directorList.directors[0].person.personId.should.be.equal(newHolder.personId);
                res.body.currentCompanyState.directorList.directors[0].person.name.should.be.equal(newHolder.name);
                done();
            })
        });

        it('does a person update (director, implicit holder)', function(done){
            req.post('/api/transaction/compound/'+companyId)
                .send({transactions: [{actions: [{
                "transactionType": "HOLDER_CHANGE",
                "afterHolder": {
                    "name": "Directio",
                    "address": "homeopathic"
                },
                "beforeHolder": {
                    "name": "Directy",
                    "address": "home",
                }}]}]})
            .expect(200)
            .then(() => req.get('/api/company/'+companyId+'/get_info'))
            .then((res) => {
                let newHolding = _.find(res.body.currentCompanyState.holdingList.holdings, (h) => h.name === 'Allocation 1');
                let newHolder = _.find(newHolding.holders, h => _.isMatch(h.person, {name: 'Directio'})).person;;

                newHolding = _.find(res.body.currentCompanyState.holdingList.holdings, (h) => h.name === 'Allocation 2');
                newHolder = _.find(newHolding.holders, h => _.isMatch(h.person, {name: 'Directio'})).person;;

                res.body.currentCompanyState.directorList.directors[0].person.personId.should.be.equal(newHolder.personId);
                res.body.currentCompanyState.directorList.directors[0].person.name.should.be.equal(newHolder.name);
                done();
            })
        });
    });


    describe('Test import with confusing directorships (99 ALBERT STREET LIMITED)', function(){
        var req, companyId, classes, holdings, initialState;
        it('should login successfully', function(done) {
            req = request.agent(sails.hooks.http.app);
            login(req).then(done);
        });
        it('Does a stubbed import (99 ALBERT STREET LIMITED)', function(done){
            req.post('/api/company/import/companiesoffice/663667')
                .expect(200)
                .then(function(res){
                    companyId = res.body.id;
                    done();
                });
        });

    });

    describe('Test import with confusing addresses (BOLLORE)', function(){
        var req, companyId, classes, holdings, initialState;
        it('should login successfully', function(done) {
            req = request.agent(sails.hooks.http.app);
            login(req).then(done);
        });
        it('Does a stubbed import (99 ALBERT STREET LIMITED)', function(done){
            req.post('/api/company/import/companiesoffice/614119')
                .expect(200)
                .then(function(res){
                    companyId = res.body.id;
                    done();
                });
        });

    });

    describe('Test import with immediate address change (4113181)', function(){
        var req, companyId;
        it('should login successfully', function(done) {
            req = request.agent(sails.hooks.http.app);
            login(req).then(done);
        });
        it('Does a stubbed import', function(done){
            req.post('/api/company/import/companiesoffice/4113181')
                .expect(200)
                .then(function(res){
                    companyId = res.body.id;
                    done();
                })
                .catch(done);
        });
        it('Imports history', function(done){
            req.post('/api/company/'+companyId+'/import_pending_history')
                .expect(200)
                .then(function(res){
                    done();
                })
                .catch(done);
        });
    });

    describe('Test import with resolution and reset catalex (5311842)', function(){
        var req, companyId, context, classes, holdings;
        it('should login successfully', function(done) {
            req = request.agent(sails.hooks.http.app);
            login(req).then(done);
        });
        it('Does a stubbed import', function(done){
            req.post('/api/company/import/companiesoffice/5311842')
                .expect(200)
                .then(function(res){
                    companyId = res.body.id;
                    done();
                })
                .catch(done);
        });
        it('check pending history', function(done){
            req.get('/api/company/'+companyId+'/pending_history')
                .then(function(res){
                    res.body.length.should.be.equal(27);
                    done();
                });
        });
        it('Imports history', function(done){
            req.post('/api/company/'+companyId+'/import_pending_history')
                .expect(500)
                .then(function(res){
                    context = res.body.context;
                    res.body.context.importErrorType.should.be.equal('UNKNOWN_AMEND');
                    done();
                });
        });
        it('Submits resolution (amend)', function(done){
            return fs.readFileAsync('test/fixtures/transactionData/catalexResolveAmend.json', 'utf8')
                .then(function(text){
                    var json = JSON.parse(text);
                    json.pendingActions.map(function(p){
                        p.id = context.actionSet.id;
                        p.previous_id = context.actionSet.previous_id;
                    });
                    return req.put('/api/company/'+companyId+'/update_pending_history')
                        .send(json)
                        .expect(200)
                })
                .then(function(){
                     return req.post('/api/company/'+companyId+'/import_pending_history')
                        .expect(500)
                })
                .then(function(res){
                    context = res.body.context;
                    res.body.context.importErrorType.should.be.equal('AMEND_TRANSFER_ORDER');
                    done();
                })
        });
        it('Submits resolution (transfer/amend order, part 1)', function(done){
            return fs.readFileAsync('test/fixtures/transactionData/catalexResolveHoldingAmend1.json', 'utf8')
                .then(function(text){
                    var json = JSON.parse(text);
                    json.pendingActions.map(function(p){
                        p.id = context.actionSet.id;
                        p.previous_id = context.actionSet.previous_id;
                    });
                    return req.put('/api/company/'+companyId+'/update_pending_history')
                        .send(json)
                        .expect(200)
                })
                .then(function(){
                     return req.post('/api/company/'+companyId+'/import_pending_history')
                        .expect(500)
                })
                .then(function(res){
                    context = res.body.context;
                    res.body.context.importErrorType.should.be.equal('AMEND_TRANSFER_ORDER');
                    done();
                })
        });
        it('Submits resolution (transfer/amend order, part 2)', function(done){
            return fs.readFileAsync('test/fixtures/transactionData/catalexResolveHoldingAmend2.json', 'utf8')
                .then(function(text){
                    var json = JSON.parse(text);
                    json.pendingActions.map(function(p){
                        p.id = context.actionSet.id;
                        p.previous_id = context.actionSet.previous_id;
                    });
                    return req.put('/api/company/'+companyId+'/update_pending_history')
                        .send(json)
                        .expect(200)
                })
                .then(function(){
                     return req.post('/api/company/'+companyId+'/import_pending_history')
                        .expect(200)
                })
                .then(function(){
                    return req.get('/api/company/'+companyId+'/share_register')
                })
                .then(function(res){
                    res.body.shareRegister[0].issueHistory.length.should.be.at.least(0);
                    res.body.shareRegister[0].transferHistoryTo.length.should.be.least(0);
                    res.body.shareRegister[0].transferHistoryFrom.length.should.be.least(0);
                     res.body.shareRegister.map(s => {
                        should.equal(s.shareClass, null);
                    })
                    done();
                })
        });
        it('check pending history', function(done){
            req.get('/api/company/'+companyId+'/pending_history')
                .then(function(res){
                    res.body.length.should.be.equal(0);
                    done();
                });
        });
       it('Creates share classes', function(done){
            req.post('/api/company/'+companyId+'/share_classes/create')
                .send({json: JSON.stringify({name: 'Class A'})})
                .then(function(){
                    done();
                })
                .catch(done);
        });

        it('Gets current stats', function(done){
            req.get('/api/company/'+companyId+'/get_info')
                .expect(200)
                .then(function(res){
                    classes = _.reduce(res.body.currentCompanyState.shareClasses.shareClasses, (acc, item, key) => {
                        acc[item.name] = item.id;
                        return acc;
                    }, {});
                    holdings = _.map(res.body.currentCompanyState.holdingList.holdings, (holding, key) => {
                        return holding.holdingId;
                    });
                    done();
                })
                .catch(done);
        });


        it('Applies share classes', function(done){
            req.post('/api/transaction/apply_share_classes/'+companyId)
                .send({actions: holdings.map(h => ({
                        transactionType: 'APPLY_SHARE_CLASS',
                        shareClass: classes['Class A'],
                        holdingId: h
                    }))
                })
                .expect(200)
                .then(function(res){
                    done();
                })
                .catch(done)
        });

        it('check seed in history', function(done){
            req.get('/api/company/'+companyId+'/transactions')
                .then(function(res){
                    res.body.transactions.some(doc => {
                        return doc.transaction.type === Transaction.types.SEED;
                    }).should.be.equal(true);
                    res.body.transactions.length.should.be.equal(3);
                    done();
                });
        });

        it('check pending history', function(done){
            req.get('/api/company/'+companyId+'/pending_history')
                .then(function(res){
                    res.body.length.should.be.equal(36);
                    done();
                });
        });

        it('checks share register is empty', function(done){
            return req.get('/api/company/'+companyId+'/share_register')
            .then(function(res){
                res.body.shareRegister.map(s => {
                    should.equal(null, s.issueHistory)
                    should.equal(null, s.transferHistoryTo)
                    should.equal(null, s.transferHistoryFrom)
                    s.shareClass.should.equal(classes['Class A']);
                });
                done();
            })
        });

        it('Imports history', function(done){
            req.post('/api/company/'+companyId+'/import_pending_history')
                .expect(200)
                .then(function(res){
                    done();
                });
        });

        it('check share register', function(done){
            req.get('/api/company/'+companyId+'/share_register')
                .then(function(res){
                    res.body.shareRegister[0].issueHistory.length.should.be.at.least(0);
                    res.body.shareRegister[0].transferHistoryTo.length.should.be.least(0);
                    res.body.shareRegister[0].transferHistoryFrom.length.should.be.least(0);
                    res.body.shareRegister.map(s => {
                        should.equal(s.shareClass, classes['Class A']);
                    })
                    done();
                });
        });


        it('check transaction history', function(done){
            req.get('/api/company/'+companyId+'/transactions')
                .then(function(res){
                    res.body.transactions.length.should.be.equal(33);
                    done();
                });
        });

        it('reset history', function(done){
            req.put('/api/company/'+companyId+'/reset_pending_history')
                .expect(200)
                .then(function(res){
                    done();
                });
        });

        it('check pending history', function(done){
            req.get('/api/company/'+companyId+'/pending_history')
                .then(function(res){
                    res.body.length.should.be.equal(27);
                    done();
                });
        });

        it('check transaction history', function(done){
            req.get('/api/company/'+companyId+'/transactions')
                .then(function(res){
                    res.body.transactions.length.should.be.equal(3);
                    done();
                });
        });

        it('checks share register is empty', function(done){
            return req.get('/api/company/'+companyId+'/share_register')
            .then(function(res){
                res.body.shareRegister.map(s => {
                    should.equal(null, s.issueHistory)
                    should.equal(null, s.transferHistoryTo)

                    should.equal(null, s.transferHistoryFrom)
                    s.shareClass.should.equal(classes['Class A']);
                });
                done();
            })
        });


        it('Imports history, fails', function(done){
            req.post('/api/company/'+companyId+'/import_pending_history')
                .expect(500)
                .then(function(res){
                    context = res.body.context;
                    res.body.context.importErrorType.should.be.equal('UNKNOWN_AMEND');
                    done();
                });
        });
    });



    describe('Test import with tricky person amend (1951111)', function(){
        var req, companyId, context, classes, holdings;
        it('should login successfully', function(done) {
            req = request.agent(sails.hooks.http.app);
            login(req).then(done);
        });
        it('Does a stubbed import', function(done){
            req.post('/api/company/import/companiesoffice/1951111')
                .expect(200)
                .then(function(res){
                    companyId = res.body.id;
                    done();
                })
                .catch(done);
        });
        it('Imports history', function(done){
            req.post('/api/company/'+companyId+'/import_pending_history')
                .expect(200)
                .then(function(res){
                    done();
                });
        });
    });

   describe('Test import with multi person transfer (3272188)', function(){
        var req, companyId, context, classes, holdings;
        it('should login successfully', function(done) {
            req = request.agent(sails.hooks.http.app);
            login(req).then(done);
        });
        it('Does a stubbed import', function(done){
            req.post('/api/company/import/companiesoffice/3272188')
                .expect(200)
                .then(function(res){
                    companyId = res.body.id;
                    done();
                })
                .catch(done);
        });
        it('Imports history', function(done){
            req.post('/api/company/'+companyId+'/import_pending_history')
                .expect(200)
                .then(function(res){
                    done();
                });
        });
    });

   describe('Test again import with multi person transfer (2284911)', function(){
        var req, companyId, context, classes, holdings;
        it('should login successfully', function(done) {
            req = request.agent(sails.hooks.http.app);
            login(req).then(done);
        });
        it('Does a stubbed import', function(done){
            req.post('/api/company/import/companiesoffice/2284911')
                .expect(200)
                .then(function(res){
                    companyId = res.body.id;
                    done();
                })
                .catch(done);
        });
        it('Imports history', function(done){
            req.post('/api/company/'+companyId+'/import_pending_history')
                .expect(500)
                .then(function(res){
                    //res.body.context.action.afterAmount.should.be.equal(20);
                    //res.body.context.action.beforeAmount.should.be.equal(40);
                    res.body.context.importErrorType.should.be.equal('UNKNOWN_AMEND');
                    //res.body.context.relatedActions.length.should.be.equal(4);
                    done();
                });
        });
    });


});