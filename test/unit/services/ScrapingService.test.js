var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var moment = require('moment');
const cheerio = require('cheerio');

describe('Scraping Service', function() {

    describe('Data extraction', function(){

        it('extract previous company names', function(done){
                const html = `<div><div class="previousNames" style="display: block;">
                        <label>
                            SM ENTERPRISES LIMITED (from 24 Oct 2013 to 10 Jul 2015)
                        </label><br>
                        <label>
                            SHEARS AND MAC LIMITED (from 11 Aug 2010 to 24 Oct 2013)
                        </label><br>
                        <label>
                            SHEARS &amp; MAC 4 LIMITED (from 10 Sep 2008 to 11 Aug 2010)
                        </label><br>
                        <label>
                            CAMM 4 LIMITED (from 06 Nov 2002 to 10 Sep 2008)
                        </label><br>
                        <label>
                            CONSULTING STRATEGIC BRANDS LIMITED (from 22 Dec 2000 to 06 Nov 2002)
                        </label><br>
                        </div></div>div>`

                ScrapingService.parsePreviousNames(cheerio.load(html)).should.deep.equal([
                    {
                        name: 'SM ENTERPRISES LIMITED',
                        startDate: '24 Oct 2013',
                        endDate: '10 Jul 2015',
                    },
                    {
                        name: 'SHEARS AND MAC LIMITED',
                        startDate:'11 Aug 2010',
                        endDate: '24 Oct 2013',
                    },
                    {
                        name: 'SHEARS & MAC 4 LIMITED',
                        startDate: '10 Sep 2008',
                        endDate: '11 Aug 2010',
                    },
                    {
                        name: 'CAMM 4 LIMITED',
                        startDate:'06 Nov 2002',
                        endDate: '10 Sep 2008',
                    },
                    {
                        name: 'CONSULTING STRATEGIC BRANDS LIMITED',
                        startDate: '22 Dec 2000',
                        endDate: '06 Nov 2002',
                    },
                ]);
                done();
        });
    });


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
                .catch(done)
        })
    });

    describe.skip('Parse Xero documents', function() {
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
                    return TransactionService.performInverseTransaction({id: 1, ...amend}, company);
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
                    return TransactionService.performInverseTransaction({id: 2, ...issue}, company);
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
                        return TransactionService.performInverseTransaction({id: 3, ...(_.find(data, {documentId: documentId}))}, company);
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
                .catch(done)
        })
    })
    describe.skip('Should get all fields from Timely html doc', function() {
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
                .then(function(_processedDocs){
                    let processedDocs = _processedDocs.concat(InferenceService.extraActions(data, _processedDocs));
                    processedDocs = InferenceService.segmentAndSortActions(processedDocs);
                    return Promise.each(processedDocs, function(doc){
                        return TransactionService.performInverseTransaction({id: '2', ...doc}, company);
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
                .catch(done)
        })
    });

    describe('Should get all fields from Evolution html doc', function() {
        // THIS TEST CASE HAS AMBIGUITY FROM DUPLICATE HOLDERS
        it('passes doc to scraping service', function(done) {
            var data, company, docs, state;
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
                .then(() => done())
               /* .then(function( _processedDocs){
                    let processedDocs = _processedDocs.concat(InferenceService.extraActions(data, _processedDocs));
                    docs = InferenceService.segmentAndSortActions(processedDocs);
                    return company.createPrevious();
                })
                .then(function(){
                    return company.getCurrentCompanyState();
                })
                .then(function(_state){
                    state = _state;
                    return Actions.create({actions: docs.filter(p=>p.actions)});
                })
                .then(function(actions){
                    state.set('historical_action_id', actions.id);
                    return state.save();
                })
                .then(function(){
                    return Promise.each(docs, function(doc, i){
                        return TransactionService.performInverseTransaction({id: i, ...doc}, company);
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
                .catch(done)*/
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



    /*
    describe('Should infer action types from large doc', function() {
        // TODO
        it('organize ambigious actions', function(done){
            Promise.join(
                         fs.readFileAsync('test/fixtures/companies_office/documents/15081231.html', 'utf8'),
                         fs.readFileAsync('test/fixtures/companies_office/documents/15081232.html', 'utf8'))
                .spread(function(first, second){
                    const docs = [ScrapingService.processDocument(first), ScrapingService.processDocument(second)];
                    const results = ScrapingService.segmentActions(docs);
                    // TODO
                    done();
                })
            });

    });*/


    describe('should infer name change actions when documents are missing (1109509)', function(){
        it('populates actions, checks that inferred name changes are present', function(done){
            let data;
             return fs.readFileAsync('test/fixtures/companies_office/1109509.html', 'utf8')
                .then(ScrapingService.parseNZCompaniesOffice)
                .then((_data) => {
                    data = _data;
                    return ScrapingService.getDocumentSummaries(data)
                })
                .then((readDocuments) => ScrapingService.processDocuments(data, readDocuments))
                .then(documents => {
                    documents.reduce((acc, d) => {
                        return acc + (d.actions || []).filter(a=>{
                            return a.transactionType === Transaction.types.NAME_CHANGE
                        }).length;
                    }, 0).should.be.equal(4);
                    done();
                })
            })
    });

});