var request = require('supertest');

describe('AuthController', function() {

    describe('#login()', function() {
        var req;
        it('should fail authorization', function(done) {
            req = request.agent(sails.hooks.http.app);
            req
                .get('/api/get_info')
                .expect(403, done)
        });
        it('should fail login', function(done) {
            req
                .post('/auth/local')
                .send({'email': 'testacular@email.com', 'password': 'badpassword'})
                .expect(403, done)
        });
        it('should fail login', function(done) {
            req
                .post('/auth/local')
                .send({'identifier':'bademail@email.com', 'password': 'badpassword'})
                .expect(403, done)
        });
        it('should get login page', function(done) {
            req
                .get('/')
                .expect(200, done)
        });
        it('should login successfully', function(done) {
            req
                .post('/auth/local')
                .send({'identifier': 'testacular@email.com', 'password': 'testtest'})
                .expect(302, done)
        });
        it('should navigate to protected page', function(done) {
            req
                .get('/api/get_info')
                .expect(200, done)
        });
        it('should logout', function(done) {
            req
                .get('/logout')
                .expect(302, done)
        });
        it('should fail authorization', function(done) {
            req
                .get('/api/get_info')
                .expect(403, done)
        });
    });
});