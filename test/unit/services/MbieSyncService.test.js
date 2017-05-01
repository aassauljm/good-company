var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var moment = require('moment');
const cheerio = require('cheerio');


describe('MBIE Sync Service', function() {

    describe('Merges IDs in ', function(){

        it('loads company into db', function(done) {
            var data;
            fs.readFileAsync('test/fixtures/companies_office/api/9429049726725/scrapingData.json', 'utf8')
                .then(JSON.parse)
                .then(ScrapingService.populateDB)
                .then(company => {
                    return company.getNowCompanyState()
                })
                .then(state => {
                    done();
                })
            })
    })
})