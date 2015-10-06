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
                    return fs.readFileAsync('test/fixtures/companies_office/Xero.html', 'utf8')
                })
            .then(ScrapingService.parseNZCompaniesOffice)
            .then(function(result) {
                result.should.deep.equal(data);
                return data;
            })
            .then(ScrapingService.populateDB)
            .then(function(){
                return Company.findOne({companyName: 'XERO LIMITED'})
            })
            .then(function(company){
                console.log(company)
                done();
            })
        })

})
});