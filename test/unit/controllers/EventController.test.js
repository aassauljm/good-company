var request = require("supertest");

describe('EventController', function() {

    describe('Should read, create, update and delete', function() {
        var req, event;
        it('should login successfully', function(done) {
            req = request.agent(sails.hooks.http.app);
            req
                .post('/auth/local')
                .send({'identifier': 'event@email.com', 'password': 'testtest'})
                .expect(302, done)
        });

        it('should get no event', function(done) {
            req
                .get('/api/events')
                .expect(200)
                .then(r => {
                    r.body.length.should.be.equal(0);
                    done();
                })
        });

        it('should create event', function(done) {
            req
                .post('/api/event')
                .send({data: {title: 'test1'}})
                .expect(201, done)
        });

        it('should get one event', function(done) {
            req
                .get('/api/events')
                .expect(200)
                .then(r => {
                    r.body.length.should.be.equal(1);
                    event = r.body[0];
                    done();
                });
        });

        it('should update event', function(done) {
            req
                .put('/api/event/'+event.id)
                .send({data: {title: '2'}})
                .expect(200, done)
        });
        it('should get one updated event', function(done) {
            req
                .get('/api/events')
                .expect(200)
                .then(r => {
                    r.body.length.should.be.equal(1);
                    r.body[0].data.title.should.be.equal('2');
                    done();
                });
        });
        it('should delete event', function(done) {
            req
                .delete('/api/event/'+event.id)
                .expect(200, done);
        });
        it('should get no event', function(done) {
            req
                .get('/api/events')
                .expect(200)
                .then(r => {
                    r.body.length.should.be.equal(0);
                    done()
                });
        });
    });

    describe('Should confirm visibility is restricted', function() {
        var req, event;
        it('should login successfully', function(done) {
            req = request.agent(sails.hooks.http.app);
            req
                .post('/auth/local')
                .send({'identifier': 'event@email.com', 'password': 'testtest'})
                .expect(302, done)
        });

        it('should create event', function(done) {
            req
                .post('/api/event')
                .send({data: {title: 'test1'}})
                .expect(201, done)
        });

        it('should get one event', function(done) {
            req
                .get('/api/events')
                .expect(200)
                .then(r => {
                    r.body.length.should.be.equal(1);
                    event = r.body[0];
                    done();
                });
        });

        it('should login successfully', function(done) {
            req = request.agent(sails.hooks.http.app);
            req
                .post('/auth/local')
                .send({'identifier': 'eventstealer@email.com', 'password': 'testtest'})
                .expect(302, done)
        });

        it('should get no event', function(done) {
            req
                .get('/api/events')
                .expect(200)
                .then(r => {
                    r.body.length.should.be.equal(0);
                    done();
                })
        });

        it('should fail to update event', function(done) {
            req
                .put('/api/event/'+event.id)
                .send({data: {title: '2'}})
                .expect(403, done)
        });

        it('should fail to delete event', function(done) {
            req
                .delete('/api/event/'+event.id)
                .expect(403, done);
        });
    });
})