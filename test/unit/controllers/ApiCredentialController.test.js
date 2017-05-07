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

        it('should redirect to companies office oauth login', function(done) {
            req.get('/api/auth-with/companies-office')
                .expect(302)
                .then(response => {
                    // Check the redirect to the companies office oauth contains all the correct parameters
                    const expectedRedirectUrl = UtilService.buildUrl(`${sails.config.mbie.companiesOffice.oauth.url}authorize`, {
                        client_id: sails.config.mbie.companiesOffice.oauth.consumerKey,
                        redirect_uri: `${sails.config.APP_URL}/api%2Fauth-with%2Fcompanies-office`,
                        response_type: 'code',
                        scope: 'openid'
                    });

                    return response.headers.location.should.be.equal(expectedRedirectUrl);
                })
                .catch(() => {})
                .then(() => done()); // .then() after a catch is the closest to a .finally() we can get
        });

        it('should redirect to home page with error when Companies Office returns an error', function() {
            req.get('/api/auth-with/companies-office?error=SOME_RANDOM_ERROR_MESSAGE')
                .expect(302)
                .then(response => {
                    const expectedRedirectUrl = `${sails.config.APP_URL}/?error=FAIL_COMPANIES_OFFICE`;
                    return response.headers.location.should.be.equal(expectedRedirectUrl);
                })
                .catch(error => {})
                .then(() => done());
        });

        it('should retrieve oauth token from companies office', function(done) {
            req.get('/api/auth-with/companies-office?code=some_random_code')
                .expect(302)
                .then(response => {
                    const expectedRedirectUrl = sails.config.APP_URL;
                    return response.headers.location.should.be.equal(expectedRedirectUrl);
                })
                .catch(error => {})
                .then(() => done());

        });
    });

    describe('NZBN', function() {
        var req, companyId;
        
        it('should login successfully', function(done) {
            req = request.agent(sails.hooks.http.app);
            login(req, 'mbie-services')
                .then(done);
        });

        it('should redirect to NZBN oauth login', function(done) {
            req.get('/api/auth-with/nzbn')
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
                .catch(() => {})
                .then(() => done()); // .then() after a catch is the closest to a .finally() we can get
        });

        it('should redirect to home page with error when NZBN returns an error', function() {
            req.get('/api/auth-with/nzbn?error=SOME_RANDOM_ERROR_MESSAGE')
                .expect(302)
                .then(response => {
                    const expectedRedirectUrl = `${sails.config.APP_URL}/?error=FAIL_NZBN`;
                    return response.headers.location.should.be.equal(expectedRedirectUrl);
                })
                .catch(error => {})
                .then(() => done());
        });

        // TODO: test '/api/auth-with/nzbn?code=some_random_code'
    });

});