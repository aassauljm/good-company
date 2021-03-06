var Promise = require('bluebird');

describe('Holding Model', function() {
    describe('Basic holding', function() {
        var firstId, secondId;
        it('Sets up first share holding', function(done) {
            Holding.build({
                parcels: [{amount: 10, shareClass: 1}, {amount: 5, shareClass: 2}]
            }, {include: Holding.include.all()}).save()
            .then(function(holding){
                firstId = holding.id;
                firstId.should.not.be.null;
                return Holding.findById(firstId, {include: [{model: Parcel, as: 'parcels'}]});
            })
            .then(function(holding){
                holding.parcels.length.should.be.equal(2);
                done();
            })
        });
        it('Sets up second share holding', function(done) {
            Holding.build({
                parcels: [{amount: 100, shareClass: 1}, {amount: 50, shareClass: 2}]
            },{include: Holding.include.all()}).save()
            .then(function(holding){
                secondId = holding.id;
                secondId.should.not.be.null;
                return Holding.findById(secondId, {include: [{model: Parcel, as: 'parcels'}]});
            })
            .then(function(holding){
                holding.parcels.length.should.be.equal(2);
                done();
            })
        });
        it('Compare equivalency of holders, empty case', function(done) {
            var holding = Holding.build({
                parcels: [{amount: 100, shareClass: 1}],
                holders: [{person: {name: 'Jim'}}, {person: {name: 'Disco Tech', companyNumber: '1'}}]
            },{include: Holding.include.all()})
            holding.holdersMatch({})
                .should.be.false;
                done();
        });

        it('Compare equivalency of holders, almost match', function(done) {
            var holding = Holding.build({
                parcels: [{amount: 100, shareClass: 1}],
                holders: [{person: {name: 'Jim'}}, {person: {name: 'Disco Tech', companyNumber: '1'}}]
            },{include: Holding.include.all()});

            holding.holdersMatch({holders: [{name: 'Jim'}]})
                .should.be.false;
                done();
        });
        it('Compare equivalency of holders, almost match again', function(done) {
            var holding = Holding.build({
                parcels: [{amount: 100, shareClass: 1}],
                holders: [{person: {name: 'Jim'}}, {person: {name: 'Disco Tech', companyNumber: '1'}}]
            },{include: Holding.include.all()})
            holding.holdersMatch({holders: [{name: 'Jim'}, {name: 'Disco Tech'}]})
                .should.be.false;
                done();
        });
        it('Compare equivalency of holders, match', function(done) {
            var holding = Holding.build({
                parcels: [{amount: 100, shareClass: 1}],
                holders: [{person: {name: 'Jim'}}, {person: {name: 'Disco Tech', companyNumber: '1'}}]
            },{include: Holding.include.all()})
            holding.holdersMatch({holders: [{person: {name: 'Jim'}}, {person: {name: 'Disco Tech', companyNumber: '1'}}]})
                .should.be.true;
                done();
        });
    });
});