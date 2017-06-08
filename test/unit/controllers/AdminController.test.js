var request = require('supertest');

describe('AdminController', function() {

    describe('Tests admin routes', function() {
        var req;
        it('should fail authorization', function(done) {
            req = request.agent(sails.hooks.http.app);
            req
                .post('/api/admin/billing')
                .send({
                    key: sails.config.ADMIN_KEY + '1234'
                })
                .expect(403, done)
        });
        it('should pass authorization', function(done) {
            req
                .post('/api/admin/billing')
                .send({
                    key: sails.config.ADMIN_KEY
                })
                .expect(200, done)
        });

    });
});