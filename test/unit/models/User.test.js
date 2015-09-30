describe('Users Model', function() {
    describe('Find an User', function() {
        it('should have more than 0 entries', function(done) {
            User.find()
                .then(function(users) {
                    users.length.should.not.be.eql(0);
                    user = _.findWhere(users, {username: 'test-user'});
                    user.should.be.an('object');
                })
                .then(done)
            });
        it('should have more than 0 passports', function(done) {
            Passport.find()
                .then(function(pp) {
                    pp.length.should.not.be.eql(0);
                })
                .then(done)
            });

    });



});