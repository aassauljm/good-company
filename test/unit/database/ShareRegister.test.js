import Promise from  'bluebird';
import moment from 'moment';
import chai from 'chai';
const should = chai.should();

describe('Share Register', function() {

    describe('Populate a company with many transactions', function() {
        let state, company

        before(function(){
             const initialState = {
                companyName: 'Sharing is caring',
                holdingList: {holdings: [{
                        name: 'Allocation 1',
                        holders: [{
                            name: 'mike'
                        }],
                        parcels: [{
                            amount: 1,
                            shareClass: 1
                        }]
                    },{
                        name: 'Allocation 2',
                        holders: [{
                            name: 'mike'
                        },{
                            name: 'john'
                        }],
                        parcels: [{
                            amount: 2,
                            shareClass: 2
                        }]
                    }],
                    effectiveDate: new Date()
                }
            };

            const transactions = [
                {
                    actions: [{
                        transactionType: Transaction.types.ISSUE_UNALLOCATED,
                        amount: 100,
                        shareClass: 1
                    }, {
                        transactionMethod: Transaction.types.AMEND,
                        transactionType: Transaction.types.ISSUE_TO,
                        amount: 100,
                        beforeAmount: 0,
                        afterAmount: 100,
                        shareClass: 1,
                        holders: [{
                            name: 'mike'
                        }]
                    }],
                    effectiveDate: new Date()
                },
                {
                    actions:[{
                        transactionMethod: Transaction.types.AMEND,
                        transactionType: Transaction.types.TRANSFER_FROM,
                        amount: 1,
                        shareClass: 1,
                        beforeAmount: 101,
                        afterAmount: 100,
                        holders: [{
                            name: 'mike'
                        }]
                    },{
                        transactionMethod: Transaction.types.AMEND,
                        transactionType: Transaction.types.TRANSFER_TO,
                        amount: 1,
                        shareClass: 1,
                        beforeAmount: 0,
                        afterAmount: 1,
                        holders: [{
                            name: 'mike'
                        },{
                            name: 'john'
                        }]
                    }],
                    effectiveDate: new Date()
                },
                {
                    actions:[{
                        transactionMethod: Transaction.types.AMEND,
                        transactionType: Transaction.types.TRANSFER_FROM,
                        amount: 1,
                        shareClass: 2,
                        beforeAmount: 2,
                        afterAmount: 1,
                        holders: [{
                            name: 'mike'
                        },{
                            name: 'john'
                        }]
                    },{
                        transactionMethod: Transaction.types.AMEND,
                        transactionType: Transaction.types.TRANSFER_TO,
                        amount: 1,
                        shareClass: 2,
                        beforeAmount: 0,
                        afterAmount: 1,
                        holders: [{
                            name: 'mike'
                        }]
                    }],
                    effectiveDate: new Date()
                }

            ];
            return Company.create({})
            .then(function(_company){
                company = _company;
                return CompanyState.createDedup(initialState)
            })
            .then(_state => {
                state = _state;
                return company.setCurrentCompanyState(state);
            })
            .then(() => {
                return Promise.each(transactions, function(set) {
                    return TransactionService.performTransaction(set, company, state)
                        .then(_state => {
                            state = _state;
                        });
                })
            })
        });

        it('Confirms share register result', function() {
            return company.getShareRegister()
                .then(function(sr){
                    const mikeA = _.find(sr.shareRegister, {name: 'mike', shareClass: 1, holdingName: 'Allocation 1'});
                    const mikeB = _.find(sr.shareRegister, {name: 'mike', shareClass: 2, holdingName: 'Allocation 2'});
                    const johnA = _.find(sr.shareRegister, {name: 'john', shareClass: 1, holdingName: 'Allocation 2'});
                    const johnB = _.find(sr.shareRegister, {name: 'john', shareClass: 2, holdingName: 'Allocation 2'});
                    mikeA.issueHistory.length.should.be.equal(1);
                    mikeA.amount.should.be.equal(100);
                    mikeA.transferHistoryFrom.length.should.be.equal(1);

                    mikeB.transferHistoryFrom.length.should.be.equal(1)
                    johnA.transferHistoryTo.length.should.be.equal(1);
                    should.equal(null, mikeA.transferHistoryTo);
                    should.equal(null, mikeB.issueHistory);
                    should.equal(null, mikeB.transferHistoryTo);
                    should.equal(null, johnA.issueHistory);
                    johnA.amount.should.be.equal(1)
                })
        })
    })
})
