describe('Users Model', function() {
    describe('Find an User', function() {
        it('should have more than 0 entries', function(done) {
            User.findAll()
                .then(function(users) {
                    users.length.should.not.be.eql(0);
                    var user = _.findWhere(users, {username: 'test-user'});
                    user.should.be.an('object');
                })
                .then(done)
            });
        it('should have more than 0 passports', function(done) {
            Passport.findAll()
                .then(function(pp) {
                    pp.length.should.not.be.eql(0);
                })
                .then(done)
            });
    });
    describe('Test User creation', function() {
        var count;
        it('should rollback after failing to supply valid info', function(done) {
            User.findAll()
                .then(function(users) {
                    count = users.length;
                    return User.register({email: 'a@b.com', username: 'userwithoutpassword'})
                })
                .catch(function(){
                    return User.findAll()
                })
                .then(function(users){
                    users.length.should.be.eql(count);
                    done();
                })
        });
    });

});