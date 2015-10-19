var Promise = require('bluebird');

describe('Shareholding Model', function() {
    describe('Basic shareholding', function() {
        var firstId, secondId;
        it('Sets up first share holding', function(done) {
            Shareholding.build({ companyId: 1,
                parcels: [{amount: 10, shareClass: 'A'}, {amount: 5, shareClass: 'B'}]
            }, {include: [{all: true}]}).save()
            .then(function(shareholding){
                firstId = shareholding.id;
                firstId.should.not.be.null;
                return Shareholding.findById(firstId, {include: [{model: Parcel, as: 'parcels'}]});
            })
            .then(function(shareholding){
                shareholding.parcels.length.should.be.equal(2);
                done();
            })
        });
        it('Sets up second share holding', function(done) {
            Shareholding.build({ companyId: 1,
                parcels: [{amount: 100, shareClass: 'A'}, {amount: 50, shareClass: 'B'}]
            },{include: [{all: true}]}).save()
            .then(function(shareholding){
                secondId = shareholding.id;
                secondId.should.not.be.null;
                return Shareholding.findById(secondId, {include: [{model: Parcel, as: 'parcels'}]});
            })
            .then(function(shareholding){
                shareholding.parcels.length.should.be.equal(2);
                done();
            })
        });

        /*it('Combines share holdings', function(done){
            Promise.join(
                Shareholding.findOne({id: firstId}).populateAll(),
                Shareholding.findOne({id: secondId}).populateAll()
                ).spread(function(share1, share2){
                    //console.log(arguments);
                    return share1.combine(share2)
                })
                .then(function(){
                    done();
                });


        });*/

    });
});