const moment = require('moment');

describe('Should segment actions', function() {
    it('Splits a transaction with multiple dates', function(done){
        const results = InferenceService.segmentAndSortActions([{
            actions:
                [{data: 'first', effectiveDate: moment('05 May 2000', 'DD MMM YYYY').toDate()},
                    {data: 'second', effectiveDate: moment('06 May 2000', 'DD MMM YYYY').toDate()},
                    {data: 'first', effectiveDate: moment('05 May 2000', 'DD MMM YYYY').toDate()}]
        }]);
        results.length.should.be.equal(2);
        results[0].actions.length.should.be.equal(1);
        results[1].actions.length.should.be.equal(2);
        results[1].actions[0].data.should.be.equal('first');
        done();
    });
    it('actions take parents date and group if not defined', function(done){
        const results = InferenceService.segmentAndSortActions([{
            date: moment('05 May 2000', 'DD MMM YYYY').toDate(),

            actions:
                [{data: 'first'},
                    {data: 'second', effectiveDate: moment('06 May 2000', 'DD MMM YYYY').toDate()},
                    {data: 'first'}]
        }]);
        results.length.should.be.equal(2);
        results[0].actions.length.should.be.equal(1);
        results[1].actions.length.should.be.equal(2);
        results[1].actions[0].data.should.be.equal('first');
        done();
    });

});