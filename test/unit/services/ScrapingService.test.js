var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));

describe('Scraping Service', function() {

    describe('Should get all fields from Xero html doc', function() {
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
   describe('Parse Xero documents', function() {
        it('get and apply data structures for each file', function(done) {
            var data, startStats;
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
                    this.company = company;
                    return this.company.getCurrentCompanyState({include: CompanyState.includes.full()});
                })
                .then(function(state){
                    return state.stats();
                })
                .then(function(stats){
                    startStats = stats;
                })
                .then(function(){
                    this.amend = _.find(this.data, {documentId: '21472248'});
                    return ScrapingService.populateHistory(this.amend, this.company);
                })
                .then(function(){
                    return this.company.getRootCompanyState()
                })
                .then(function(state){
                    return state.stats();
                })
                .then(function(stats){
                    this.secondStats = stats;
                    stats.totalShares.should.be.equal(startStats.totalShares);
                    stats.totalAllocatedShares.should.not.be.equal(startStats.totalSAllocatedShares);
                    stats.totalUnallocatedShares.should.not.be.equal(startStats.totalUnallocatedShares);
                    var allocated = 0;
                    this.amend.actions.map(function(action){
                        allocated -= action.afterAmount - action.beforeAmount;
                    });
                    (allocated + startStats.totalAllocatedShares).should.be.equal(stats.totalAllocatedShares);
                    (startStats.totalUnallocatedShares - allocated).should.be.equal(stats.totalUnallocatedShares);
                })
                .then(function(){
                    this.issue = _.find(this.data, {documentId: '21471850'});
                    return ScrapingService.populateHistory(this.issue, this.company);
                })
                .then(function(){
                    return this.company.getRootCompanyState()
                })
                .then(function(state){
                    return state.stats();
                })
                .then(function(stats){
                    stats.totalShares.should.be.equal(startStats.totalShares - this.issue.actions[0].amount);
                    stats.totalUnallocatedShares.should.be.equal(this.secondStats.totalUnallocatedShares - this.issue.actions[0].amount)
                })
                .then(function(){
                    var company = this.company;
                    return Promise.each(['21386429', '21000586', '21000301', '21000289'], function(documentId){
                        return ScrapingService.populateHistory(_.find(this.data, {documentId: documentId}), company);
                    })
                })
                .then(function(){
                    return this.company.getRootCompanyState()
                })
                .then(function(state){
                    return state.stats();
                })
                .then(function(stats){
                    // todo, reconfirm numbers
                    stats.totalUnallocatedShares.should.be.equal(28128064)
                    stats.totalAllocatedShares.should.be.equal(107888740)
                    stats.totalShares.should.be.equal(136016804)
                    return done();
                })
        })
    })
    describe('Should get all fields from Timely html doc', function() {
        it('passes doc to scraping service', function(done) {
            var data, company;
            return fs.readFileAsync('test/fixtures/companies_office/Timely.html', 'utf8')

                .then(ScrapingService.parseNZCompaniesOffice)
                .then(function(_data){
                    data = _data;
                    return data;
                })
                .then(ScrapingService.populateDB)
                .then(function(data){
                    this.data = data;
                    return Company.findOne({where: {companyName: 'TIMELY LIMITED'}})
                })
                .then(function(_company){
                    company = _company;
                    return company.getCurrentCompanyState({include: CompanyState.includes.full()});
                })
                .then(function(companyState){
                    return companyState.stats();
                })
                .then(function(stats){
                    stats.totalShares.should.equal(1365670);
                })
                .then(function(){
                    return Promise.map(data.documents, function(document){
                        return fs.readFileAsync('test/fixtures/companies_office/documents/'+document.documentId+'.html', 'utf8')
                            .then(function(data){
                                return ScrapingService.processDocument(data, document);
                            });
                        }, {concurrency: 10})

                })
                .then(function(documentSummaries){
                    return Promise.each(data.documents, function(doc){
                        var action = _.find(documentSummaries, {documentId: doc.documentId});
                        return ScrapingService.populateHistory(action, company);
                    });
                })
                .then(function(){
                    return company.getRootCompanyState()
                })
                .then(function(state){
                    return state.stats();
                })
                .then(function(stats){
                    stats.totalUnallocatedShares.should.be.equal(0)
                    stats.totalAllocatedShares.should.be.equal(1000)
                    stats.totalShares.should.be.equal(1000)
                    done();
                })
        })
    });


});