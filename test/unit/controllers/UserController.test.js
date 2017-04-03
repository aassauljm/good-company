var request = require("supertest");
var Promise = require("bluebird");


describe('UserController', function() {

    describe('#login()', function() {
        var req, id;
        it('should login successfully', function(done) {
            req = request.agent(sails.hooks.http.app);
            req
                .post('/auth/local')
                .send({'identifier': 'testacular@email.com', 'password': 'testtest'})
                .expect(302, done)
        });
        it('confirm that now signed in', function(done) {
            req
                .get('/api/get_info')
                .expect(200)
                .then(function(res){
                    id = res.body.id;
                    done();
                })
        });
        /*it('users api should return only this user', function(done) {
            req
                .get('/api/user')
                .expect(200)
                .then(function(res){
                    res.body.length.should.be.eql(1);
                    done();
                })
                .catch(done)
        });*/
        it('users api should return this user info on request', function(done) {
            req
                .get('/api/user/'+id)
                .expect(200)
                .then(function(res){
                    res.body.id.should.be.eql(id);
                    done();
                })
        });
        it("users api should not return another's user info on request", function(done) {
            req
                .get('/api/user/'+(id-1))
                .expect(403)
                .then(function(res){
                    done();
                })
        });
       /* it('should attempt change password, fail auth', function(done) {
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
                .expect(302, done)
        });
        it('should change password back', function(done) {
             req
                .put('/api/set_password')
                .send({'oldPassword': 'hunter12', 'newPassword': 'testtest'})
                .expect(200, done)
            });*/

    });

    /*describe('it should be able to register new user', function(done){
        var req;
        it('should get signup page', function(done){
            req = request.agent(sails.hooks.http.app)
            req.get('/signup')
                .set('Accept', 'text/html')
            .expect(200, done)
        });
        it('get sign up page validation error', function(done) {
            req
                .post('/api/user/signup')
                .send({})
                .expect(400)
                .then(function(){
                    done();
                })
        });
        it('get sign up page validation error again', function(done) {
            req
                .post('/api/user/signup')
                .send({'email': 'testacular@email.com', 'username': 'duplicate'})
                .expect(400)
                .then(function(){
                    done();
                })
        });
        it('get sign up page validation error again from no password', function(done) {
            req
                .post('/api/user/signup')
                .send({'email': 'testaculary@email.com', 'username': 'nonduplicate'})
                .expect(400)
                .then(function(){
                    done();
                })
        });
        it('sign up sucessfully', function(done) {
            req
                .post('/api/user/signup')
                .send({'email': 'testaculary@email.com', 'username': 'nonduplicate', 'password': 'password'})
                .expect(200, done);
        });
        it('confirm that now signed in', function(done) {
            req
                .get('/api/get_info')
                .expect(200, done);
        });
    });*/

});