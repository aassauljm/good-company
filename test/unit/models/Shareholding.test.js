var Promise = require('bluebird');

describe('Shareholding Model', function() {
    describe('Basic shareholding', function() {
        var first_id, second_id;
        it('Sets up first share holding', function(done) {
            Shareholding.build({
                parcels: [{amount: 10, shareClass: 'A'}, {amount: 5, shareClass: 'B'}]
            }, {include: [{all: true}]}).save()
            .then(function(shareholding){
                first_id = shareholding.id;
                first_id.should.not.be.null;
                return Shareholding.findById(first_id, {include: [{model: Parcel, as: 'parcels'}]});
            })
            .then(function(shareholding){
                shareholding.parcels.length.should.be.equal(2);
                done();
            })
        });
        it('Sets up second share holding', function(done) {
            Shareholding.build({
                parcels: [{amount: 100, shareClass: 'A'}, {amount: 50, shareClass: 'B'}]
            },{include: [{all: true}]}).save()
            .then(function(shareholding){
                second_id = shareholding.id;
                second_id.should.not.be.null;
                return Shareholding.findById(second_id, {include: [{model: Parcel, as: 'parcels'}]});
            })
            .then(function(shareholding){
                shareholding.parcels.length.should.be.equal(2);
                done();
            })
        });

        /*it('Combines share holdings', function(done){
            Promise.join(
                Shareholding.findOne({id: first_id}).populateAll(),
                Shareholding.findOne({id: second_id}).populateAll()
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