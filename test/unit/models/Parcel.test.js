describe('Parcel Model', function() {
    describe('Parcel Comparison', function() {
        it('should identify similiar and different parcel types', function(done) {
            Parcel.combinable({amount: 10, shareClass: 'A'}, {amount: 1, shareClass: 'B'}).should.be.false;
            Parcel.combinable({amount: 10, shareClass: 'A'}, {amount: 1, shareClass: 'A'}).should.be.true;
            done();
        });
    });
});