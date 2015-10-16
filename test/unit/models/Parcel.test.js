describe('Parcel Model', function() {
    describe('Parcel Comparison', function() {

        it('should identify similiar and different parcel types', function(done) {
            Parcel.match({amount: 10, shareClass: 'A'}, {amount: 1, shareClass: 'B'}).should.be.false;
            Parcel.match({amount: 10, shareClass: 'A'}, {amount: 1, shareClass: 'A'}).should.be.true;
            done();
        });

        it('should error on bad addition', function(done) {
            Parcel.build({amount: 10, shareClass: 'A'})
                .combine(Parcel.build({amount: 1, shareClass: 'B'}))
                .should.be.rejectedWith(sails.config.exceptions.BadParcelOperation)
                .should.notify(done);
        });

        it('should succeed on good addition', function(done) {
            return Parcel.build({amount: 10, shareClass: 'A'})
                .combine(Parcel.build({amount: 1, shareClass: 'A'}))
                .should.be.fulfilled
                .eventually.property('amount', 11)
                .should.notify(done);
        });

    });
});