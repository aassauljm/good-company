const moment = require('moment');
var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));


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

    describe('should infer a set of changes for CataLex (5311842)', function(){
        it('populates actions, infers and splits transfers, conversions', function(){
            let data;
             return fs.readFileAsync('test/fixtures/companies_office/5311842.html', 'utf8')
                .then(ScrapingService.parseNZCompaniesOffice)
                .then((_data) => {
                    data = _data;
                    return ScrapingService.getDocumentSummaries(data)
                })
                .then((readDocuments) => ScrapingService.processDocuments(data, readDocuments))
                .then(documents => {
                    const results = InferenceService.segmentAndSortActions(documents);
                    results.reduce((acc, d) => {
                        return acc + (d.actions || []).filter(a=>{
                            return a.transactionType === Transaction.types.CONSOLIDATION_FROM;
                        }).length;
                    }, 0).should.be.equal(3);

                    results.reduce((acc, d) => {
                        return acc + (d.actions || []).filter(a=>{
                            return a.transactionType === Transaction.types.CONVERSION_TO;
                        }).length;
                    }, 0).should.be.equal(9);

                    results.reduce((acc, d) => {
                        return acc + (d.actions || []).filter(a=>{
                            return a.transactionType === Transaction.types.TRANSFER_TO
                        }).length;
                    }, 0).should.be.equal(2);

                })
            })
    });



});