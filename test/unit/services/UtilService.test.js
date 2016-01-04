import chai from 'chai';
import { subsetSum } from '../../../api/services/UtilService';
const should = chai.should();

describe('Utility Services', function() {

    describe('Subset Sum function', function() {
        it('calculates correct results', function(done) {
            should.Throw(() => subsetSum([], 0));
            subsetSum([1], 1).should.be.deep.equal({sum: 1, vals: [1]});
            subsetSum([1,2,3], 5).should.be.deep.equal({sum: 5, vals: [2,3]});
            subsetSum([1,2,3], 6).should.be.deep.equal({sum: 6, vals: [1, 2,3]});
            should.Throw(() => subsetSum([1,2,3], 7));
            should.Throw(() => subsetSum([1,2,3,100], 7));
            subsetSum([1,1,1,1,1,100], 101).should.be.deep.equal({sum: 101, vals: [1,100]});
            subsetSum([1,1,1,1,1,100], 104).should.be.deep.equal({sum: 104, vals: [1,1,1,1,100]});
            subsetSum([456,3254,4356,678,345,234,6578,34,23436], 26924).should.be.deep.equal({sum: 26924, vals: [3254,234,23436]});
            done();
        });
    });
});
