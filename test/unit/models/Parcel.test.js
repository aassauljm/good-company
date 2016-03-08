describe('Parcel Model', function() {
    describe('Parcel Comparison', function() {

        it('should identify similiar and different parcel types', function(done) {
            Parcel.match({amount: 10, shareClass: 1}, {amount: 1, shareClass: 2}).should.be.false;
            Parcel.match({amount: 10, shareClass: 1}, {amount: 1, shareClass: 1}).should.be.true;
            done();
        });

        it('should error on bad addition', function(done) {
            (function () {
                Parcel.build({amount: 10, shareClass: 1})
                    .combine(Parcel.build({amount: 1, shareClass: 2}))

            }).should.throw(sails.config.exceptions.BadParcelOperation)
            done();
        });

        it('should succeed on good addition', function(done) {
            Parcel.build({amount: 10, shareClass: 1})
                .combine(Parcel.build({amount: 1, shareClass: 1})).should.have.property('amount', 11);
            done();

        });

    });
});