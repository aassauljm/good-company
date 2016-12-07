var Promise = require('bluebird');

var fs = Promise.promisifyAll(require("fs"));
import { formatSubmit } from '../../../assets/js/components/transactions/resolvers/amend';

describe('Amend submit', () => {
    it('confirms that submitted form is segmented by date and holding', function(done) {
        return fs.readFileAsync('test/fixtures/transactionData/catalexAmendFormValues.json', 'utf8')
            .then(data => {
                const results = formatSubmit(data.values, data.actionSet);
                console.log(results)
                done();
            })
    })

});