describe('Parcel Model', function() {
    describe('Parcel Comparison', function() {

        it('should identify similiar and different parcel types', function(done) {
            Parcel.match({amount: 10, shareClass: 'A'}, {amount: 1, shareClass: 'B'}).should.be.false;
            Parcel.match({amount: 10, shareClass: 'A'}, {amount: 1, shareClass: 'A'}).should.be.true;
            done();
        });

        it('should error on bad addition', function(done) {
            (function () {
                Parcel.build({amount: 10, shareClass: 'A'})
                    .combine(Parcel.build({amount: 1, shareClass: 'B'}))

            }).should.throw(sails.config.exceptions.BadParcelOperation)
            done();
        });

        it('should succeed on good addition', function(done) {
            Parcel.build({amount: 10, shareClass: 'A'})
                .combine(Parcel.build({amount: 1, shareClass: 'A'})).should.have.property('amount', 11);
            done();

        });

    });
});