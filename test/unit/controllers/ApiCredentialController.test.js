var Promise = require("bluebird");
var request = require("supertest");
var fs = Promise.promisifyAll(require("fs"));
import chai from 'chai';
const should = chai.should();

var login = function(req, username='companycreator@email.com'){
    return req
        .post('/auth/local')
        .send({'identifier': username, 'password': 'testtest'})
        .expect(302)
        .then(function(){
            return;
        })
}

exports.login = login;

describe('API Credential Controller', function() {

    describe('Companies Office', function() {
        var req, companyId;

        it('should login successfully', function(done) {
            req = request.agent(sails.hooks.http.app);
            login(req, 'mbie-services')
                .then(done);
        });

        it('should redirect to companies office oauth login', function() {
            return req.get('/api/auth-with/companies-office')
                .expect(302)
                .then(response => {
                    // Check the redirect to the companies office oauth contains all the correct parameters
                    const expectedRedirectUrl = UtilService.buildUrl(`${sails.config.mbie.companiesOffice.oauth.url}authorize`, {
                        client_id: sails.config.mbie.companiesOffice.oauth.consumerKey,
                        redirect_uri: `${sails.config.APP_URL}/api/auth-with/companies-office`,
                        response_type: 'code',
                        scope: 'openid'
                    });

                    return response.headers.location.should.be.equal(expectedRedirectUrl);
                })
        });

        it('should redirect to home page with error when login process returns an error', function() {
            return req.get('/api/auth-with/companies-office?error=SOME_RANDOM_ERROR_MESSAGE')
                .expect(302)
                .then(response => {
                    const expectedRedirectUrl = `${sails.config.APP_URL}/?error=FAIL_COMPANIES_OFFICE`;
                    return response.headers.location.should.be.equal(expectedRedirectUrl);
                })
        });

        it('should retrieve oauth token from companies office', function() {
            return req.get('/api/auth-with/companies-office?code=some_random_code')
                .expect(302)
                .then(response => {
                    const expectedRedirectUrl = `${sails.config.APP_URL}/refresh_user?message_type=CONNECTED_COMPANIES_OFFICE`;
                    return response.headers.location.should.be.equal(expectedRedirectUrl);
                })
        });

        it('should redirect to home page \with error when retrieving oauth token returns an error', function() {
            return req.get('/api/auth-with/companies-office?code=code_that_will_error')
                .expect(302)
                .then(response => {
                    const expectedRedirectUrl = `${sails.config.APP_URL}/?error=FAIL_COMPANIES_OFFICE`;
                    return response.headers.location.should.be.equal(expectedRedirectUrl);
                })
        });
    });

    describe('NZBN', function() {
        var req, companyId;

        it('should login successfully', function(done) {
            req = request.agent(sails.hooks.http.app);
            login(req, 'mbie-services')
                .then(done);
        });

        it('should redirect to NZBN oauth login', function() {
            return req.get('/api/auth-with/nzbn')
                .expect(302)
                .then(response => {
                    // Check the redirect to the nzbn oauth contains all the correct parameters
                    const expectedRedirectUrl = UtilService.buildUrl(`${sails.config.mbie.nzbn.oauth.url}authorize`, {
                        client_id: sails.config.mbie.nzbn.oauth.consumerKey,
                        redirect_uri: `${sails.config.APP_URL}/api/auth-with/nzbn`,
                        response_type: 'code',
                        scope: 'openid'
                    });

                    return response.headers.location.should.be.equal(expectedRedirectUrl);
                })
        });

        it('should redirect to home page with error when login process returns an error', function() {
            return req.get('/api/auth-with/nzbn?error=SOME_RANDOM_ERROR_MESSAGE')
                .expect(302)
                .then(response => {
                    const expectedRedirectUrl = `${sails.config.APP_URL}/?error=FAIL_NZBN`;
                    return response.headers.location.should.be.equal(expectedRedirectUrl);
                })
        });


        it('should retrieve oauth token from nzbn', function() {
            return req.get('/api/auth-with/nzbn?code=some_random_code')
                .expect(302)
                .then(response => {
                    const expectedRedirectUrl = `${sails.config.APP_URL}/import/nzbn`;
                    return response.headers.location.should.be.equal(expectedRedirectUrl);
                })
        });

        it('should redirect to home page with error when retrieving oauth token returns an error', function() {
            return req.get('/api/auth-with/nzbn?code=code_that_will_error')
                .expect(302)
                .then(response => {
                    const expectedRedirectUrl = `${sails.config.APP_URL}/?error=FAIL_NZBN`;
                    return response.headers.location.should.be.equal(expectedRedirectUrl);
                })
        });
    });

});