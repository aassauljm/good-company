var Promise = require('bluebird');

describe('Shareholding Model', function() {
    describe('Basic shareholding', function() {
        var first_id, second_id;
        it('Sets up first share holding', function(done) {
            Shareholding.create({
                parcels: [{amount: 10, shareClass: 'A'}, {amount: 5, shareClass: 'B'}]
            })
            .then(function(shareholding){
                first_id = shareholding.id;
                first_id.should.not.be.null;
                return Shareholding.findOne({id: first_id})
                    .populate('parcels')
            })
            .then(function(shareholding){
                shareholding.parcels.length.should.be.equal(2);
                done();
            })
        });
        it('Sets up second share holding', function(done) {
            Shareholding.create({
                parcels: [{amount: 100, shareClass: 'A'}, {amount: 50, shareClass: 'B'}]
            })
            .then(function(shareholding){
                second_id = shareholding.id;
                second_id.should.not.be.null;
                return Shareholding.findOne({id: second_id})
                    .populate('parcels')
            })
            .then(function(shareholding){
                shareholding.parcels.length.should.be.equal(2);
                done();
            })
        });
        it('Combines share holdings', function(done){
            Promise.join(
                Shareholding.findOne({id: first_id}).populateAll(),
                Shareholding.findOne({id: second_id}).populateAll()
                ).then(function(share1, share2){
                    //console.log(arguments);
                    done();
                });


        });

    });
});