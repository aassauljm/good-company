var request = require('supertest');

var login = function(req){
    return req
        .post('/auth/local')
        .send({'identifier': 'favourites@email.com', 'password': 'testtest'})
        .expect(302)
}

const OWNED_COMPANY = 5;
const NON_OWNED_COMPANY = 1;

describe('FavouriteController', function() {
    let req;
    before(() => {
        req = request.agent(sails.hooks.http.app);
        return login(req);
    });
    describe('add and remove favourites', () => {
        it('checks that favourites is just the company list', () => {
            return req.get('/api/companies')
                .expect(200)
                .then(function(res){
                    res.body.filter(b => b.favourite).length.should.be.equal(0);
                });
        });

        it('adds company, checks result, removes again ', () => {
            return req.post('/api/favourites/'+ OWNED_COMPANY)
                .expect(200)
                .then(function(res){
                   return req.get('/api/companies');
                })
                .then(function(res){
                    res.body.filter(b => b.favourite).length.should.be.equal(1);
                    return req.delete('/api/favourites/'+ OWNED_COMPANY)
                })
                .then(function(res){
                   return req.get('/api/companies');
                })
                .then(function(res){
                    res.body.filter(b => b.favourite).length.should.be.equal(0);
                })
        });

        it('adds non accessible company, checks result ', () => {
            return req.post('/api/favourites/'+ NON_OWNED_COMPANY)
                .expect(403)

        });
    });

});