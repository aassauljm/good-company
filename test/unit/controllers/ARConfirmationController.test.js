var request = require("supertest");
var Promise = require("bluebird");


describe('ARConfirmationController', function() {
    let arConfirmationRequests, companyId, authedReq;
    describe('login etc', function() {

        before(() => {
            authedReq = request.agent(sails.hooks.http.app);
            return authedReq
                .post('/auth/local')
                .send({'identifier': 'armasterclass@email.com', 'password': 'testtest'})
                .expect(302)
        });

        it('get company name', function() {
            return authedReq
                .get('/api/company')
                .expect(200)
                .then(response => {
                    companyId = response.body[0].id;
                })
        });

        it('submits ar for confirmation', function() {
            return authedReq
                .post(`/api/company/${companyId}/ar_confirmation`)
                .send({
                    arConfirmationRequests: [
                        {email: 'longjohn@email.com', name: 'spanish fly'},
                        {email: 'longerjohn@email.com', name: 'spanish grill'}
                    ],
                    arData: {

                    },
                    year: (new Date()).getFullYear()
                })
                .expect(200)
        });

        it('gets deadline info', function() {
            return authedReq
                .get(`/api/company/${companyId}/get_info`)
                .expect(200)
                .then(response => {
                    const annualReturn = response.body.currentCompanyState.deadlines.annualReturn;
                    annualReturn.confirmations.outstanding.should.be.equal(2);
                    annualReturn.confirmations.confirmed.should.be.equal(0);
                    annualReturn.confirmations.total.should.be.equal(2);
                    annualReturn.confirmations.feedback.should.be.equal(0);
                })
        });

        it('gets codes', function() {
            return authedReq
                .get(`/api/company/${companyId}/ar_confirmation`)
                .expect(200)
                .then(response => {
                    response.body.arConfirmationRequests.length.should.be.equal(2);
                    arConfirmationRequests = response.body.arConfirmationRequests;
                });
        });

    });

    describe('uses unauthenticated endpoints', function() {
        let req;

        it('uses a bad code and fails', function(){
            req = request.agent(sails.hooks.http.app);
            return req
                .get(`/api/ar_confirmation/${arConfirmationRequests[0].code+'1234'}`)
                .expect(404)

        });

        it('uses code to get ar information', function(){
            return req
                .get(`/api/ar_confirmation/${arConfirmationRequests[0].code}`)
                .expect(200)
                .then(response => {
                    response.body.arConfirmation.companyId.should.be.equal(companyId);
                })

        });

        it('uses code to post confirmation', function(){
            return req
                .put(`/api/ar_confirmation/${arConfirmationRequests[0].code}`)
                .send({
                    confirmed: true
                })
                .expect(200)
        });

        it('checks result using code', function(){
            return req
                .get(`/api/ar_confirmation/${arConfirmationRequests[0].code}`)
                .expect(200)
                .then(response => {
                    response.body.confirmed.should.be.equal(true);
                });

        });

        it('checks deadlines with original user', function(){
            return authedReq
                .get(`/api/company/${companyId}/get_info`)
                .expect(200)
                .then(response => {
                    const annualReturn = response.body.currentCompanyState.deadlines.annualReturn;
                    annualReturn.confirmations.outstanding.should.be.equal(1);
                    annualReturn.confirmations.confirmed.should.be.equal(1);
                    annualReturn.confirmations.total.should.be.equal(2);
                    annualReturn.confirmations.feedback.should.be.equal(0);
                })
        });

        it('uses a bad code and fails', function(){
            req = request.agent(sails.hooks.http.app);
            return req
                .get(`/api/ar_confirmation/${arConfirmationRequests[0].code+'1234'}`)
                .expect(404)

        });

        it('uses code to post confirmation', function(){
            return req
                .put(`/api/ar_confirmation/${arConfirmationRequests[1].code}`)
                .send({
                   feedback: 'it bad'
                })
                .expect(200)
        });

        it('checks deadlines with original user', function(){
            return authedReq
                .get(`/api/company/${companyId}/get_info`)
                .expect(200)
                .then(response => {
                    const annualReturn = response.body.currentCompanyState.deadlines.annualReturn;
                    annualReturn.confirmations.outstanding.should.be.equal(0);
                    annualReturn.confirmations.confirmed.should.be.equal(1);
                    annualReturn.confirmations.total.should.be.equal(2);
                    annualReturn.confirmations.feedback.should.be.equal(1);
                })
        });

        it('original user overrides feedback', function(){
            return authedReq
                .put(`/api/ar_confirmation/${arConfirmationRequests[1].code}`)
                .send({
                   feedback: null,
                   confirmed: true
                })
                .expect(200)
        });

        it('checks deadlines with original user', function(){
            return authedReq
                .get(`/api/company/${companyId}/get_info`)
                .expect(200)
                .then(response => {
                    const annualReturn = response.body.currentCompanyState.deadlines.annualReturn;
                    annualReturn.confirmations.outstanding.should.be.equal(0);
                    annualReturn.confirmations.confirmed.should.be.equal(2);
                    annualReturn.confirmations.total.should.be.equal(2);
                    annualReturn.confirmations.feedback.should.be.equal(0);
                })
        });
    });

});