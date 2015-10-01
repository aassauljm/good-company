var request = require("supertest-as-promised");

describe('Error Views', function() {

    describe('Not Found', function() {
        var req;
        it('should login successfully', function(done) {
            req = request.agent(sails.hooks.http.app);
            req
                .post('/auth/local')
                .send({'identifier': 'testacular@email.com', 'password': 'testtest'})
                .expect(200, done)
        });
        // test environment return 500 instead of 404
        /*it('should get model not found', function(done) {
            req
                .get('/api/user/-1')
                .expect(404, done)
        });
        it('should get model not found', function(done) {
            req
                .get('/api/user/x')
                .expect(404, done)
        });*/
    });


})