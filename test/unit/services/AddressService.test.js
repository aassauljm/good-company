import chai from 'chai';
import { compareAddresses } from '../../../api/services/AddressService';
const should = chai.should();

describe('Address Service', function() {

    describe('Compare two addresses', function() {
        it('should match addresses', function(done) {
            compareAddresses('256 Waddington Drive, Naenae, Lower Hutt, New Zealand', '256, Waddington Dve Naenae, Lower Hutt, New Zealand').should.be.equal(true);
            done();
        });
    });

});
