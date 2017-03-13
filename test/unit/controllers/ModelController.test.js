var request = require("supertest-as-promised");

describe('Model Controller', function() {

    describe('Admin can read, but cannot create, update or delete models', function() {
        var req, modelId;
        it('should login successfully and get model list', function(done) {
            req = request.agent(sails.hooks.http.app);
            req
                .post('/auth/local')
                .send({'identifier': 'admintester@email.com', 'password': 'testtest'})
                .expect(302)
                .then(function(){
                    return req.get('/api/model').expect(200)
                })
                .then(function(res){
                    var models = res.body;
                    modelId = models[0].id;
                    _.intersection(_.pluck(models, 'name'), [
                      'Model',
                      'Permission',
                      'Role',
                      'User'
                    ]).length.should.be.eql(4);
                    done();
                })
        });

        it('should get model single model definition', function(done) {
            req
                .get('/api/model/'+modelId)
                .expect(200, done)
        });
        it('should fail to create model', function(done) {
            req
                .post('/api/model')
                .send({})
                .expect(403, done)
        });
        it('should fail to update model', function(done) {
            req
                .put('/api/model/'+modelId)
                .send({})
                .expect(403, done)
        });
        it('should fail to delete model', function(done) {
            req
                .delete('/api/model/'+modelId)
                .send({})
                .expect(403, done)
        });
    });

    describe('Regular user cannot read, create, update or delete models', function() {
        var req;
        it('should login successfully and not get model list', function(done) {
            req = request.agent(sails.hooks.http.app);
            req
                .post('/auth/local')
                .send({'identifier': 'test@email.com', 'password': 'testtest'})
                .expect(302)
                .then(function(){
                    return req.get('/api/model').expect(403)
                })
                .then(function(){
                    done()
                })
        });

        it('should not get model single model definition', function(done) {
            req
                .get('/api/model/1')
                .expect(403, done)
        });
        it('should fail to create model', function(done) {
            req
                .post('/api/model')
                .send({})
                .expect(403, done)
        });
        it('should fail to update model', function(done) {
            req
                .put('/api/model/1')
                .send({})
                .expect(403, done)
        });
        it('should fail to delete model', function(done) {
            req
                .delete('/api/model/1')
                .send({})
                .expect(403, done)
        });
    });
})