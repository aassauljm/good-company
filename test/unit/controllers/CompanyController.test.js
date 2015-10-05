var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));

describe('Company Controller', function() {

    describe('Should get all fields from html doc', function() {
        it('passes doc to scraping service', function(done) {
            var data;
            fs.readFileAsync('test/fixtures/companies_office/xero.json', 'utf8')
                .then(JSON.parse)
                .then(function(_data){
                    data = _data;
                })
            fs.readFileAsync('test/fixtures/companies_office/Xero.html', 'utf8')
            .then(ScrapingService.parseNZCompaniesOffice)
            .then(function(result) {
                for(var i=0;i<result.shareholdings.allocations.length;i++){
                    result.shareholdings.allocations[i].should.deep.equal(data.shareholdings.allocations[i]);
                }
                result.shareholdings.should.deep.equal(data.shareholdings);
                result.should.deep.equal(data);
                done();
            });
        })

})
});