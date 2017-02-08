var Promise = require('bluebird');

var fs = Promise.promisifyAll(require("fs"));
import moment from 'moment';
import { formatSubmit, validateAmend, collectAmendActions } from '../../../assets/js/components/transactions/resolvers/amend';
import isValid from 'redux-form/lib/isValid'

function valuesAndActionsFromJSON(path){
    return fs.readFileAsync(path, 'utf8')
        .then(data => {
            data = JSON.parse(data);
            data.actionSet.data.actions = collectAmendActions(data.actionSet.data.actions)
            data.values.actions.map((a, i) => {
                a.recipients.map((r) => {
                    r.effectiveDate = moment(r.effectiveDate).toDate()
                });
                a.data = data.actionSet.data.actions[i];
            });
            return data;
        })
}


describe('Amend validate', () => {
    it('confirms invalid amend form values report as invalid, overallocated', function(){
        return valuesAndActionsFromJSON('test/fixtures/transactionData/catalexAmendFormValuesInvalid1.json')
            .then(data => {
                const errors = validateAmend(data.values, {});
                isValid(errors).should.be.equal(false);
                errors.actions[6].recipients[1].parcels[0].amount[0].should.be.equal("Share count goes below 0.");
                errors._error.actions[0][0].should.be.equal("1 shares left to allocate.");
            });
        });
    it('confirms invalid amend form values report as invalid, duplicate share class', function(){
        return valuesAndActionsFromJSON('test/fixtures/transactionData/catalexAmendFormValuesInvalid2.json')
            .then(data => {
                const errors = validateAmend(data.values, {});
                isValid(errors).should.be.equal(false);
                errors.actions[1].recipients[0].parcels[1].shareClass[0].should.be.equal("Duplicate Share Class.");

            });
        });
    it('confirms invalid amend form values report as invalid, empty parcel', function(){
        return valuesAndActionsFromJSON('test/fixtures/transactionData/catalexAmendFormValuesInvalid3.json')
            .then(data => {
                const errors = validateAmend(data.values, {});
                isValid(errors).should.be.equal(false);
                errors.actions[4].recipients[0].parcels[0].amount[0].should.be.equal("Required.");
                errors._error.actions[0][0].should.be.equal("1 shares left to allocate.");
                //errors[6].parcels[2].amount[0].should.be.equal("Share count goes below 0.")
            });
        });  

    it('confirms valid amend form values report as valid', function(){
        return valuesAndActionsFromJSON('test/fixtures/transactionData/catalexAmendFormValues.json')
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
                const results = formatSubmit(data.values, data.actionSet);

                results.length.should.be.equal(6);

                results[0].data.actions.length.should.be.equal(7);
                results[1].data.actions.length.should.be.equal(2);
                results[1].data.actions[0].transactionType.should.be.equal('TRANSFER_TO');
                results[2].data.actions[0].transactionType.should.be.equal('ISSUE_TO');
                results[2].data.actions.length.should.be.equal(1);
                results[1].data.effectiveDate.should.not.equal(results[2].data.effectiveDate);
                let lastDate = new Date(results[0].data.effectiveDate)
                for(var i=1;i<results.length;i++){
                    const thisDate = new Date(results[i].data.effectiveDate);
                    (thisDate <= lastDate).should.be.equal(true);
                    lastDate = thisDate;
                }
                results.reduce((sum, r) => {
                    return r.data.actions.reduce((sum, a) => {
                        return sum + (a.transactionMethod === 'NEW_ALLOCATION' ? 1 : 0)
                    }, sum)
                }, 0).should.be.equal(5);
                done();
            })
            .catch(done);
    });


    it('confirms that submitted form is segmented by date and holding, again', function(done) {
        return valuesAndActionsFromJSON('test/fixtures/transactionData/catalexAmendFormValues2.json')
            .then(data => {
                const results = formatSubmit(data.values, data.actionSet);

                results.length.should.be.equal(7);
                let lastDate = new Date(results[0].data.effectiveDate)
                for(var i=1;i<results.length;i++){
                    const thisDate = new Date(results[i].data.effectiveDate);
                    (thisDate <= lastDate).should.be.equal(true);
                    lastDate = thisDate;
                }
                results.reduce((sum, r) => {
                    return r.data.actions.reduce((sum, a) => {
                        return sum + (a.transactionMethod === 'NEW_ALLOCATION' ? 1 : 0)
                    }, sum)
                }, 0).should.be.equal(5);
                results.reduce((sum, r) => {
                    return r.data.actions.reduce((sum, a) => {
                        return sum + (a.transactionType === 'ISSUE_TO' ? 1 : 0)
                    }, sum)
                }, 0).should.be.equal(2);

                done();
            })
            .catch(done);
    });

});