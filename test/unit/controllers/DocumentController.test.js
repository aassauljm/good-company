var request = require("supertest");
var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));

function binaryParser(res, callback) {
    res.setEncoding('binary');
    res.data = '';
    res.on('data', function (chunk) {
        res.data += chunk;
    });
    res.on('end', function () {
        callback(null, new Buffer(res.data, 'binary'));
    });
}

describe('DocumentController', function() {

    var req, documentId, client_id;
    it('should login successfully', function(done) {
        req = request.agent(sails.hooks.http.app);
        req
            .post('/auth/local')
            .send({'identifier': 'documentuploader@email.com', 'password': 'testtest'})
            .expect(302, done)
    });

    it('should upload document', function(done) {
        req
            .post('/api/document/upload_document')
            .attach('document', 'test/fixtures/pdf-sample.pdf')
            .expect(201)
            .then(function(res){
                documentId = res.body.id;
                done();
            });
    });
    it('should get raw document', function(done) {
        req
            .get('/api/document/get_document/'+documentId)
            .expect(200)
            .expect('Content-Type', 'application/pdf')
            .expect('Content-Disposition', 'attachment; filename="pdf-sample.pdf"')
            .parse(binaryParser)
            .then(function(res){
                fs.readFileAsync('test/fixtures/pdf-sample.pdf', 'binary')
                .then(function(f){
                    JSON.stringify(res.body).should.be.eql(JSON.stringify(new Buffer(f, 'binary')));
                    done();
                })
            })
    });
    it('should get document preview', function(done) {
        req
            .get('/api/document/get_document_preview/'+documentId)
            .expect(200)
            .expect('Content-Type', 'image/png')
            .then(function(){
                done();
            });
    });
    it('logs out and confirms file is inaccessible', function(done) {
        req
            .get('/logout')
            .expect(302)
            .then(function(){
                return req.get('/api/document/get_document/'+documentId)
            })
            .then(function(res){
                res.status.should.be.eql(403);
                done();
            })
    });

    it('should login with other account and fail to get record', function(done) {
        req = request.agent(sails.hooks.http.app);
        req
            .post('/auth/local')
            .send({'identifier': 'documentstealer@email.com', 'password': 'testtest'})
            .expect(302)
            .then(function(){
                return req.get('/api/document/'+documentId)
            })
            .then(function(res){
                res.status.should.be.eql(403);
                done();
            })
            .catch(done)
        });

    it('should login with other account and fail to get raw document', function(done) {
        req.get('/api/document/get_document/'+documentId)
            .then(function(res){
                res.status.should.be.eql(403);
                done();
            });
    });

    it('relogs in as client and reconfirms file is accessible', function(done) {
        req
            .post('/auth/local')
            .send({'identifier': 'documentuploader@email.com', 'password': 'testtest'})
            .expect(302)
            .then(function(){
                return req.get('/api/document/get_document/'+documentId)
                     .expect(200)
            }).then(function(){
                done();
            })
    });

    it('updates document name', function(done) {
        const newName = 'different_name.ext';
        req.put('/api/document/'+documentId)
            .send({'filename': newName})
            .expect(200)
            .then(function(){
                return req.get('/api/document/'+documentId)
                     .expect(200)
            }).then(function(res){
                res.body.filename.should.be.equal(newName);
                done();
            })
    });

});