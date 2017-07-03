var request = require("supertest");
var Promise = require("bluebird");


describe('ARConfirmationController', function() {
    let arConfirmationRequests;
    describe('login etc', function() {
        var req, companyId;
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
        it('uses code to get ar information', function(){
            req = request.agent(sails.hooks.http.app);
            return req
                .get(`/api/ar_confirmation/${arConfirmationRequests[0].code}`)
                .expect(200)

        });

    });

});