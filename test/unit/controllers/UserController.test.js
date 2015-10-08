var request = require("supertest-as-promised");
var Promise = require("bluebird");


describe('UserController', function() {

    describe('#login()', function() {
        var req, id;
        it('should login successfully', function(done) {
            req = request.agent(sails.hooks.http.app);
            req
                .post('/auth/local')
                .send({'identifier': 'testacular@email.com', 'password': 'testtest'})
                .expect(200, done)
        });
        it('should attempt change password, fail auth', function(done) {
            req
                .put('/api/set_password')
                .send({'oldPassword': 'test2', 'newPassword': 'hunter12'})
                .expect(403)
                .then(function(){
                    done();
                })
            });
        it('should fail validation', function(done) {

            req
                .put('/api/set_password')
                .send({'oldPassword': 'testtest', 'newPassword': 'h'})
                .expect(400, done)

        });
        it('should succeed validation', function(done) {
            req
                .put('/api/set_password')
                .send({'oldPassword': 'testtest', 'newPassword': 'hunter12'})
                .expect(200, done)
        })
        it('should logout', function(done) {
            req
                .get('/logout')
                .expect(302, done)
        });
        it('should not login successfully with old password', function(done) {
            req
                .post('/auth/local')
                .send({'identifier': 'testacular@email.com', 'password': 'test'})
                .expect(403, done)
        });
        it('should login successfully with new password', function(done) {
            req
                .post('/auth/local')
                .send({'identifier': 'testacular@email.com', 'password': 'hunter12'})
                .expect(200, done)
        });
        it('should change password back', function(done) {
             req
                .put('/api/set_password')
                .send({'oldPassword': 'hunter12', 'newPassword': 'testtest'})
                .expect(200, done)
            });

    });

    describe('it should be able to register new user', function(done){
        var req, id;
        it('should get signup page', function(done){
            req = request.agent(sails.hooks.http.app)
            req.get('/signup')
            .expect(200, done)
        });
        it('get sign up page validation error', function(done) {
            req
                .post('/api/user/signup')
                .send({})
            .expect(400, done)
        });
    });

});