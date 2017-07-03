import Promise from  'bluebird';
import moment from 'moment';
import chai from 'chai';
const should = chai.should();

describe('Deadline Tests', function() {

    describe('Create a company with no deadlines', function() {
        let state, company

        before(function(){
             const initialState = {
                companyName: 'Deadline Central',
                incorporationDate: new Date(),
                arFilingMonth: moment().format('MMMM'),
                holdingList: {holdings: []}
            };
            return Company.create({})
            .then(function(_company){
                company = _company;
                return CompanyState.createDedup(initialState)
            })
            .then(_state => {
                state = _state;
                return company.setCurrentCompanyState(state);
            })
        })


        it('gets deadlines, expects none', function() {
            return company.getDeadlines()
            .then((deadlines) => {
                deadlines.annualReturn.overdue.should.be.equal(false);
                deadlines.annualReturn.filedThisYear.should.be.equal(false);
                deadlines.annualReturn.overdue.should.be.equal(false);
                deadlines.annualReturn.dueThisMonth.should.be.equal(false);
                deadlines.annualReturn.dueThisMonth.should.be.equal(false);
                should.equal(deadlines.annualReturn.lastFiling, null);
                moment(deadlines.annualReturn.dueDate).diff(moment().add(1, 'year'), 'days').should.be.at.most(31);

            })
        });
    })

    describe('Create a company with ar due this month', function() {
        let state, company

        before(function(){
             const initialState = {
                companyName: 'Deadline Central',
                incorporationDate: moment().subtract(1, 'year').toDate(),
                arFilingMonth: moment().format('MMMM'),
                holdingList: {holdings: []}
            };
            return Company.create({})
            .then(function(_company){
                company = _company;
                return CompanyState.createDedup(initialState)
            })
            .then(_state => {
                state = _state;
                return company.setCurrentCompanyState(state);
            })
        })


        it('gets deadlines, expects one this month', function() {
            return company.getDeadlines()
            .then((deadlines) => {
                deadlines.annualReturn.overdue.should.be.equal(false);
                deadlines.annualReturn.filedThisYear.should.be.equal(false);
                deadlines.annualReturn.dueThisMonth.should.be.equal(true);
                should.equal(deadlines.annualReturn.lastFiling, null);
                moment(deadlines.annualReturn.dueDate).diff(moment(), 'days').should.be.at.most(31);
            });
        })
    });

    describe('Create a company with ar due last month', function() {
        let state, company

        before(function(){
             const initialState = {
                companyName: 'Deadline Central',
                // deal with january
                incorporationDate: moment().subtract(1, 'year').subtract(1, 'month').toDate(),
                arFilingMonth: moment().subtract(1, 'month').format('MMMM'),
                holdingList: {holdings: []}
            };
            return Company.create({})
            .then(function(_company){
                company = _company;
                return CompanyState.createDedup(initialState)
            })
            .then(_state => {
                state = _state;
                return company.setCurrentCompanyState(state);
            })
        })


        it('gets deadlines, expects over due ar', function() {
            return company.getDeadlines()
            .then((deadlines) => {
                deadlines.annualReturn.overdue.should.be.equal(true);
                deadlines.annualReturn.filedThisYear.should.be.equal(false);
                deadlines.annualReturn.dueThisMonth.should.be.equal(false);
                should.equal(deadlines.annualReturn.lastFiling, null);
            });
        });

        it('adds an annual return, checks that deadline is resolved', function() {
            const documentDate = new Date();
            return Document.create({type: 'Companies Office', filename: 'File Annual Return', date: new Date()})
            .then((document) => {
                 return TransactionService.performAllInsertByEffectiveDate([{
                        actions: [{transactionType: Transaction.types.UPDATE_SOURCE_DOCUMENTS}],
                        effectiveDate: documentDate,
                        transactionType: Transaction.types.UPDATE_SOURCE_DOCUMENTS,
                        documents: [document]
                    }], company)
            })
            .then(() => {
                return company.getDeadlines()
            })
            .then(deadlines => {
                deadlines.annualReturn.overdue.should.be.equal(false);
                deadlines.annualReturn.filedThisYear.should.be.equal(true);
                deadlines.annualReturn.dueThisMonth.should.be.equal(false);
                moment(deadlines.annualReturn.lastFiling).milliseconds(0).toISOString().should.be.equal(moment(documentDate).milliseconds(0).toISOString())
            });
        });

    });



})
