var Promise = require('bluebird');

var fs = Promise.promisifyAll(require("fs"));
import moment from 'moment';
import { formatInitialState, formatSubmit, validateAmend, collectAmendActions,  guessAmendAfterAmounts } from '../../../assets/js/components/forms/amend';
import isValid from 'redux-form/lib/isValid'

function valuesAndActionsFromJSON(path){
    return fs.readFileAsync(path, 'utf8')
        .then(data => {
            data = JSON.parse(data);
            data.actionSet.data.actions = collectAmendActions(data.actionSet.data.actions)
            data.values.actions.map((a, i) => {
                a.subActions.map((r) => {
                    r.effectiveDate = moment(r.effectiveDate).toDate()
                });
                a.data = data.actionSet.data.actions[i];

            });
            return data;
        })
}

describe('Amend format', () => {
    it('matches a pair transferees together', function(){
            return fs.readFileAsync('test/fixtures/transactionData/projectManagerTransferSimple.json', 'utf8')
            .then(data => {
                data = JSON.parse(data);
                const values = formatInitialState(collectAmendActions(data.data.actions), data.data.effectiveDate);
                isValid(validateAmend(values, {})).should.be.equal(true);
            });
        });

    it('matches transferees together, increases', function(){
            return fs.readFileAsync('test/fixtures/transactionData/projectManagerTransferAllButOne.json', 'utf8')
            .then(data => {
                data = JSON.parse(data);
                const values = formatInitialState(collectAmendActions(data.data.actions), data.data.effectiveDate);
                isValid(validateAmend(values, {})).should.be.equal(true);
            });
        });

    it('matches transferees together, decreases', function(){
            return fs.readFileAsync('test/fixtures/transactionData/projectManagerTransferAllButOneDecrease.json', 'utf8')
            .then(data => {
                data = JSON.parse(data);
                const values = formatInitialState(collectAmendActions(data.data.actions), data.data.effectiveDate);
                isValid(validateAmend(values, {})).should.be.equal(true);
            });
        });
});

describe('Amend matches up share class from company state', () => {
    it('find each holding from company state, sets after parcels', function(){
            return fs.readFileAsync('test/fixtures/transactionData/projectManagerHoldingsDefineSharesError.json', 'utf8')
            .then(data => {
                data = JSON.parse(data);
                const values = formatInitialState(collectAmendActions(data.context.actionSet.data.actions), null, null, data.context.companyState);
                values.actions[1].afterParcels.length.should.be.equal(2);
            });
        });
});


describe('Amend validate', () => {
    it('confirms invalid amend form values report as invalid, overallocated', function(){
        return valuesAndActionsFromJSON('test/fixtures/transactionData/catalexAmendFormValuesInvalid1.json')
            .then(data => {
                const errors = validateAmend(data.values, {});
                isValid(errors).should.be.equal(false);
                errors._error.actions[6][0].should.be.equal("1 shares left to allocate.");
            });
        });
    it('confirms invalid amend form values report as invalid, duplicate share class', function(){
        return valuesAndActionsFromJSON('test/fixtures/transactionData/catalexAmendFormValuesInvalid2.json')
            .then(data => {
                const errors = validateAmend(data.values, {});
                isValid(errors).should.be.equal(false);
                errors.actions[1].subActions[0].parcels[1].shareClass[0].should.be.equal("Duplicate Share Class.");

            });
        });
    it('confirms invalid amend form values report as invalid, empty parcel', function(){
        return valuesAndActionsFromJSON('test/fixtures/transactionData/catalexAmendFormValuesInvalid3.json')
            .then(data => {
                const errors = validateAmend(data.values, {});
                isValid(errors).should.be.equal(false);
                errors.actions[4].subActions[0].parcels[0].amount[0].should.be.equal("Required.");
                errors._error.actions[4][0].should.be.equal("1 shares left to allocate.");
            });
        });

    it('confirms invalid amend form values report as invalid, under allocated', function(){
        return valuesAndActionsFromJSON('test/fixtures/transactionData/catalexAmendFormValuesInvalid4.json')
            .then(data => {
                const errors = validateAmend(data.values, {});
                isValid(errors).should.be.equal(false);
                errors.actions[3].subActions[0].parcels[0].amount[0].should.be.equal("Share count for this class goes below 0.");
                errors._error.actions[3][0].should.be.equal("1 shares over allocated.");
            });
        });


    it('confirms valid amend form values report as valid', function(){
        return valuesAndActionsFromJSON('test/fixtures/transactionData/catalexAmendFormValues.json')
            .then(data => {
                const errors = validateAmend(data.values, {});
                isValid(errors).should.be.equal(true);
        });
    });

    it('confirms valid amend form values report as valid, multiple share classes', function(){
        return valuesAndActionsFromJSON('test/fixtures/transactionData/catalexAmendFormValuesMultiClass.json')
            .then(data => {
                const errors = validateAmend(data.values, {});
                isValid(errors).should.be.equal(true);
        });

    });
});


describe('Amend submit', () => {

    it('confirms that submitted form is segmented by date and holding', function(done) {
        return valuesAndActionsFromJSON('test/fixtures/transactionData/catalexAmendFormValues.json')
            .then(data => {
                const { newActions } = formatSubmit(data.values, data.actionSet);

                newActions.length.should.be.equal(5);

                newActions[0].data.actions.length.should.be.equal(2);
                newActions[0].data.actions[0].transactionType.should.be.equal('TRANSFER_TO');
                newActions[1].data.actions[0].transactionType.should.be.equal('ISSUE_TO');
                newActions[1].data.actions.length.should.be.equal(1);
                newActions[0].data.effectiveDate.should.not.equal(newActions[2].data.effectiveDate);
                let lastDate = new Date(newActions[0].data.effectiveDate)
                for(var i=1;i<newActions.length;i++){
                    const thisDate = new Date(newActions[i].data.effectiveDate);
                    (thisDate <= lastDate).should.be.equal(true);
                    lastDate = thisDate;
                }
                newActions.reduce((sum, r) => {
                    return r.data.actions.reduce((sum, a) => {
                        return sum + (a.transactionMethod === 'NEW_ALLOCATION' ? 1 : 0)
                    }, sum)
                }, 0).should.be.equal(5);

                newActions.map(r => {
                    r.data.actions.map(a => {
                        if(a.transactionMethod === 'NEW_ALLOCATION'){
                            a.parcels.map(p => {
                                p.beforeAmount.should.be.below(p.afterAmount)
                            })
                        }
                    })
                })
                done();
            })
            .catch(done);
    });


    it('confirms that submitted form is segmented by date and holding, again', function(done) {
        return valuesAndActionsFromJSON('test/fixtures/transactionData/catalexAmendFormValues2.json')
            .then(data => {
                const { newActions } = formatSubmit(data.values, data.actionSet);
                let lastDate = new Date(newActions[0].data.effectiveDate)
                for(var i=1;i<newActions.length;i++){
                    const thisDate = new Date(newActions[i].data.effectiveDate);
                    (thisDate <= lastDate).should.be.equal(true);
                    lastDate = thisDate;
                }
                newActions.reduce((sum, r) => {
                    return r.data.actions.reduce((sum, a) => {
                        return sum + (a.transactionMethod === 'NEW_ALLOCATION' ? 1 : 0)
                    }, sum)
                }, 0).should.be.equal(5);

                newActions.reduce((sum, r) => {
                    return r.data.actions.reduce((sum, a) => {
                        return sum + (a.transactionType === 'ISSUE_TO' ? 1 : 0)
                    }, sum)
                }, 0).should.be.equal(2);
                done();
            })
            .catch(done);
    });

});