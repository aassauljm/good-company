var Promise = require('bluebird');

var fs = Promise.promisifyAll(require("fs"));
import moment from 'moment';
import { formatSubmit, validateAmend } from '../../../assets/js/components/transactions/resolvers/amend';
import isValid from 'redux-form/lib/isValid'

describe('Amend validate', () => {
    it('confirms valid amend form values report as valid', function(done){
        return fs.readFileAsync('test/fixtures/transactionData/catalexAmendFormValues.json', 'utf8')
            .then(data => {
                data = JSON.parse(data);
                data.values.actions.map((a, i) => {
                    a.recipients.map((r) => {
                        r.effectiveDate = moment(r.effectiveDate).toDate()
                    });
                    a.data = data.actionSet.data.actions[i];
                });
                const errors = validateAmend(data.values, {});
                console.log(JSON.stringify(errors, null, 4));
                isValid(errors).should.be.equal(true);
                done();
                //errors.should
        });

    });
});


describe('Amend submit', () => {



    it('confirms that submitted form is segmented by date and holding', function(done) {
        return fs.readFileAsync('test/fixtures/transactionData/catalexAmendFormValues.json', 'utf8')
            .then(data => {
                data = JSON.parse(data);
                data.values.actions.map((a, i) => {
                    a.recipients.map((r) => {
                        r.effectiveDate = moment(r.effectiveDate).toDate()
                    })
                    a.data = data.actionSet.data.actions[i]
                })
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
        return fs.readFileAsync('test/fixtures/transactionData/catalexAmendFormValues2.json', 'utf8')
            .then(data => {
                data = JSON.parse(data);
                data.values.actions.map((a, i) => {
                    a.recipients.map((r) => {
                        r.effectiveDate = moment(r.effectiveDate).toDate()
                    })
                    a.data = data.actionSet.data.actions[i]
                })
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