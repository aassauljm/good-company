var request = require("supertest");
var Promise = require("bluebird");


describe('ARConfirmationController', function() {
    let arConfirmationRequests, companyId;
    describe('login etc', function() {
        var req
        it('should login successfully', function() {
            req = request.agent(sails.hooks.http.app);
            return req
                .post('/auth/local')
                .send({'identifier': 'armasterclass@email.com', 'password': 'testtest'})
                .expect(302)
        });

        it('get comapny name', function() {
            return req
                .get('/api/company')
                .expect(200)
                .then(response => {
                    companyId = response.body[0].id;
                })
        });

        it('submits ar for confirmation', function() {
            return req
                .post(`/api/company/${companyId}/ar_confirmation`)
                .send({
                    arConfirmationRequests: [
                        {email: 'longjohn@email.com', name: 'spanish fly'},
                        {email: 'longerjohn@email.com', name: 'spanish grill'}
                    ],
                    arData: {

                    }
                })
                .expect(200)
        });

        it('gets codes', function() {
            return req
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
                    response.body.arConfirmation.companyId.should.be.equal(companyId)
                })

        });

        it('uses code to post confirmation', function(){
            return req
                .post(`/api/ar_confirmation/${arConfirmationRequests[0].code}`)
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

    });

});