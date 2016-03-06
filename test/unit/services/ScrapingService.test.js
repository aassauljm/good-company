var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var moment = require('moment');


describe('Scraping Service', function() {

    describe('Should get all fields from Xero html doc', function() {
        it('passes doc to scraping service, pops db', function(done) {
            var data;
            fs.readFileAsync('test/fixtures/companies_office/xero.json', 'utf8')
                .then(JSON.parse)
                .then(function(_data){
                    data = _data;
                    return fs.readFileAsync('test/fixtures/companies_office/Xero.html', 'utf8')
                })
                .then(ScrapingService.parseNZCompaniesOffice)
                .then(function(result) {
                    result.directors.should.deep.equal(data.directors);
                    result.should.deep.equal(data);
                    return data;
                })
                .then(ScrapingService.populateDB)
                .then(function(){
                    return Company.findOne({include: [{model: CompanyState, as: 'currentCompanyState', where: {companyName: 'XERO LIMITED'}}]})
                })
                .then(function(company){
                    return company.getCurrentCompanyState({include: CompanyState.includes.full()});
                })
                .then(function(companyState){
                    return companyState.fullPopulate();
                })
                .then(function(companyState){
                    companyState.directorList.directors.length.should.be.eql(8);
                    done();
                })
        })
    });

    describe('Parse Xero documents', function() {
        it('get and apply data structures for each file', function(done) {
            var data, company, startStats, amend, issue, secondStats;
            fs.readFileAsync('test/fixtures/companies_office/xero.json', 'utf8')
                .then(JSON.parse)
                .then(function(data){
                    return Promise.map(data.documents.slice(0, 30), function(document){
                        return fs.readFileAsync('test/fixtures/companies_office/documents/'+document.documentId+'.html', 'utf8')
                            .then(function(data){
                                return ScrapingService.processDocument(data, document);
                            });
                        }, {concurrency: 10})

                })
                .then(function(_data){
                    data = _data;
                    return Company.findOne({include: [{model: CompanyState, as: 'currentCompanyState', where: {companyName: 'XERO LIMITED'}}]});
                })
                .then(function(_company){
                    company = _company;
                    return company.getCurrentCompanyState();
                })
                .then(function(companyState){
                    return companyState.fullPopulate();
                })
                .then(function(state){
                    return state.stats();
                })
                .then(function(stats){
                    startStats = stats;
                })
                .then(function(){
                    amend = _.find(data, {documentId: '21472248'});
                    return ScrapingService.populateHistory(amend, company);
                })
                .then(function(){
                    return company.getRootCompanyState()
                })
                .then(function(state){
                    return state.stats();
                })
                .then(function(stats){
                    secondStats = stats;
                    stats.totalShares.should.be.equal(startStats.totalShares);
                    stats.totalAllocatedShares.should.not.be.equal(startStats.totalSAllocatedShares);
                    stats.totalUnallocatedShares.should.not.be.equal(startStats.totalUnallocatedShares);
                    var allocated = 0;
                    amend.actions.map(function(action){
                        allocated -= action.afterAmount - action.beforeAmount;
                    });
                    (allocated + startStats.totalAllocatedShares).should.be.equal(stats.totalAllocatedShares);
                    (startStats.totalUnallocatedShares - allocated).should.be.equal(stats.totalUnallocatedShares);
                })
                .then(function(){
                    issue = _.find(data, {documentId: '21471850'});
                    return ScrapingService.populateHistory(issue, company);
                })
                .then(function(){
                    return company.getRootCompanyState()
                })
                .then(function(state){
                    return state.stats();
                })
                .then(function(stats){
                    stats.totalShares.should.be.equal(startStats.totalShares - issue.actions[0].amount);
                    stats.totalUnallocatedShares.should.be.equal(secondStats.totalUnallocatedShares - issue.actions[0].amount)
                    return company.createPrevious();
                })
                .then(function(){
                    return Promise.each(['21386429', '21000586', '21000301', '21000289'], function(documentId){
                        return ScrapingService.populateHistory(_.find(data, {documentId: documentId}), company);
                    })
                })
                .then(function(){
                    return company.getRootCompanyState()
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
                .then(function(){
                    return Company.findOne({include: [{model: CompanyState, as: 'currentCompanyState', where: {companyName: 'TIMELY LIMITED'}}]})
                })
                .then(function(_company){
                    company = _company;
                    return company.getCurrentCompanyState();
                })
                .then(function(companyState){
                    return companyState.fullPopulate();
                })
                .then(function(companyState){
                    return companyState.stats();
                })
                .then(function(stats){
                    stats.totalShares.should.equal(1365670);
                    return company.createPrevious();
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
                    documentSummaries = documentSummaries.concat(ScrapingService.extraActions(data, documentSummaries));
                    var docs = ScrapingService.segmentActions(documentSummaries)
                    return Promise.each(docs, function(doc){
                        return ScrapingService.populateHistory(doc, company);
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
                    stats.totalAllocatedShares.should.be.equal(0)
                    stats.totalShares.should.be.equal(0)
                    done();
                })
        })
    });

    describe('Should get all fields from Evolution html doc', function() {
        // THIS TEST CASE HAS AMBIGUITY FROM DUPLICATE HOLDERS
        it('passes doc to scraping service', function(done) {
            var data, company, docs;
            return fs.readFileAsync('test/fixtures/companies_office/Evolution.html', 'utf8')

                .then(ScrapingService.parseNZCompaniesOffice)
                .then(function(_data){
                    data = _data;
                    return data;
                })
                .then(ScrapingService.populateDB)
                .then(function(_company){
                    company = _company;
                    return company.getCurrentCompanyState();
                })
                .then(function(companyState){
                    return companyState.fullPopulate();
                })
                .then(function(state){
                    state.holdingList.holdings[0].parcels[0].amount.should.be.equal(50);
                    state.holdingList.holdings[1].parcels[0].amount.should.be.equal(50);
                    state.holdingList.holdings[2].parcels[0].amount.should.be.equal(50);
                    state.holdingList.holdings[3].parcels[0].amount.should.be.equal(50);
                    return state.stats();
                })
                .then(function(stats){
                    stats.totalUnallocatedShares.should.be.equal(0)
                    stats.totalAllocatedShares.should.be.equal(200)
                    stats.totalShares.should.be.equal(200)
                })
                .then(function(){
                    return Promise.map(data.documents, function(document){
                        return fs.readFileAsync('test/fixtures/companies_office/documents/'+document.documentId+'.html', 'utf8')
                            .then(function(data){
                                return ScrapingService.processDocument(data, document);
                            });
                        }, {concurrency: 10});
                })
                .then(function(documentSummaries){
                    documentSummaries = documentSummaries.concat(ScrapingService.extraActions(data, documentSummaries));
                    docs = ScrapingService.segmentActions(documentSummaries);
                    return company.createPrevious();
                })
                .then(function(){
                    return Promise.each(docs, function(doc){
                        return ScrapingService.populateHistory(doc, company);
                    });
                })
                .then(function(){
                    //return company.getRootCompanyState()
                    return company.getPreviousCompanyState(3)
                })
                .then(function(state){
                    state.holdingList.holdings.length.should.be.equal(2);
                    state.holdingList.holdings[0].parcels.length.should.be.equal(1);
                    state.holdingList.holdings[0].parcels[0].amount.should.be.equal(100);
                    state.holdingList.holdings[1].parcels[0].amount.should.be.equal(100);
                    return state.stats();
                })
                .then(function(stats){
                    stats.totalUnallocatedShares.should.be.equal(0)
                    stats.totalAllocatedShares.should.be.equal(200)
                    stats.totalShares.should.be.equal(200)
                    done();
                })
        })
    });

    describe('Should get live query results', function() {
        it('enters test string into live query', function(done) {
            ScrapingService.getSearchResults('test')
                .then(function(results) {
                    results.length.should.be.equal(15);
                    results[0].should.be.deep.equal({
                        companyNumber: '3523392',
                        companyName: 'BUY A SMILE LIMITED - 3523392 - NZBN: 9429030973022 ',
                        struckOff: true,
                        notes: ['(previously known as TESTED ON CHILDREN LIMITED)']
                    });
                    done();
                })
        });
    });
    describe('Should segment actions', function() {
        it('Splits a transaction with multiple dates', function(done){
            const results = ScrapingService.segmentActions([{
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
            const results = ScrapingService.segmentActions([{
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

});