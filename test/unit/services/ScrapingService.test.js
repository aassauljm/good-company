var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));

describe('Scraping Service', function() {

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
                    return Company.findOne({where: {companyName: 'XERO LIMITED'}})
                })
                .then(function(company){
                    return company.getCurrentCompanyState({include: CompanyState.includes.full()});
                })
                .then(function(companyState){
                    //console.log(JSON.stringify(companyState, null ,4))
                    done();
                })
        })
    });
   describe('Parse documents', function() {
        it('get data structures for each file', function(done) {
            var data;
            fs.readFileAsync('test/fixtures/companies_office/xero.json', 'utf8')
                .then(JSON.parse)
                .then(function(data){
                    return Promise.map(data.documents, function(document){
                        return fs.readFileAsync('test/fixtures/companies_office/documents/'+document.documentId+'.html', 'utf8')
                            .then(function(data){
                                return ScrapingService.processDocument(data, document);
                            });
                        }, {concurrency: 10})

                })
                .then(function(data){
                    this.data = data;
                    return Company.findOne({where: {companyName: 'XERO LIMITED'}})
                })
                .then(function(company){
                    var amend = _.find(this.data, {documentId: '21472248'});
                    //console.log(JSON.stringify(_.sortBy(this.data, 'date').reverse().slice(0, 20), null, 4));
                    console.log(amend)
                    return ScrapingService.populateHistory(amend, company);
                })

                .then(function(){
                    done();
                })
        })
    })



});