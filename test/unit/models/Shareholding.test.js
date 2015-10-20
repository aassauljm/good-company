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
        it('Compare equivalency of shareholders, empty case', function(done) {
            Shareholding.build({ companyId: 1,
                parcels: [{amount: 100, shareClass: 'A'}],
                shareholders: [{name: 'Jim'}, {name: 'Disco Tech', companyNumber: '1'}]
            },{include: [{all: true}]}).save()
            .then(function(shareholding){
                return shareholding.shareholdersMatch({})
                    .should.be.fulfilled
                    .eventually.become(false)
                    .should.notify(done);
            })
        });
        it('Compare equivalency of shareholders, almost match', function(done) {
            Shareholding.build({ companyId: 1,
                parcels: [{amount: 100, shareClass: 'A'}],
                shareholders: [{name: 'Jim'}, {name: 'Disco Tech', companyNumber: '1'}]
            },{include: [{all: true}]}).save()
            .then(function(shareholding){
                return shareholding.shareholdersMatch({shareholders: [{name: 'Jim'}]})
                    .should.be.fulfilled
                    .eventually.become(false)
                    .should.notify(done);
            })
        });
        it('Compare equivalency of shareholders, almost match again', function(done) {
            Shareholding.build({ companyId: 1,
                parcels: [{amount: 100, shareClass: 'A'}],
                shareholders: [{name: 'Jim'}, {name: 'Disco Tech', companyNumber: '1'}]
            },{include: [{all: true}]}).save()
            .then(function(shareholding){
                return shareholding.shareholdersMatch({shareholders: [{name: 'Jim'}, {name: 'Disco Tech'}]})
                    .should.be.fulfilled
                    .eventually.become(false)
                    .should.notify(done);
            })
        });
        it('Compare equivalency of shareholders, match', function(done) {
            Shareholding.build({ companyId: 1,
                parcels: [{amount: 100, shareClass: 'A'}],
                shareholders: [{name: 'Jim'}, {name: 'Disco Tech', companyNumber: '1'}]
            },{include: [{all: true}]}).save()
            .then(function(shareholding){
                return shareholding.shareholdersMatch({shareholders: [{name: 'Jim'}, {name: 'Disco Tech', companyNumber: '1'}]})
                    .should.be.fulfilled
                    .eventually.become(true)
                    .should.notify(done);
            })
        });
    });
});