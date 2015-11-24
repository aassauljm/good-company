import {form} from '../../assets/js/reducers';
import {startCreateCompany, addListEntry, removeListEntry} from '../../assets/js/actions';

describe('Creates a nested form and modifies it', () => {
    it('Seeds form', done => {
        let state = {};
        state = form(state, startCreateCompany('test'));
        state.companyFull.test.should.be.an('object');
        state.companyFull.test.shareClasses.should.be.an('object');
        state.companyFull.test.shareClasses.list.should.be.an('array');
        state.companyFull.test.shareClasses.list.length.should.be.equal(1);

        state.companyFull.test.directors.should.be.an('object');
        state.companyFull.test.directors.list.should.be.an('array');
        state.companyFull.test.directors.list.length.should.be.equal(1);

        state.companyFull.test.holdings.should.be.an('object');
        state.companyFull.test.holdings.list.should.be.an('array');
        state.companyFull.test.holdings.list.length.should.be.equal(1);
        done();
    });

    it('Adds subform', done => {
        let state = {};
        state = form(state, startCreateCompany('test'));
        state = form(state, addListEntry('companyFull', 'test', 'directors'));
        state.companyFull.test.directors.should.be.an('object');
        state.companyFull.test.directors.list.should.be.an('array');
        state.companyFull.test.directors.list.length.should.be.equal(2);

        done();
    });

    it('Adds then removes subform', done => {
        let state = {};
        state = form(state, startCreateCompany('test'));
        state = form(state, addListEntry('companyFull', 'test', 'holdings'));
        state.companyFull.test.holdings.list.length.should.be.equal(2);
        state = form(state, removeListEntry('companyFull', 'test', 'holdings', '1'));
        state.companyFull.test.holdings.list.length.should.be.equal(1);
        state.companyFull.test.holdings.list[0].should.be.equal('0');
        done();
    });

    it('Adds subsubform', done => {
        let state = {};
        state = form(state, startCreateCompany('test'));
        state.companyFull.test.holdings['0'].holders.list.should.be.an('array');
        state.companyFull.test.holdings['0'].holders.list.length.should.be.equal(1);
        state = form(state, addListEntry('companyFull', 'test', 'holdings', '0', 'holders'));
        state.companyFull.test.holdings.list.length.should.be.equal(1);
        state.companyFull.test.holdings['0'].holders.list.length.should.be.equal(2);
        done();
    });

    it('Removes subsubform', done => {
        let state = {};
        state = form(state, startCreateCompany('test'));
        state = form(state, addListEntry('companyFull', 'test', 'holdings', '0', 'holders'));
        state = form(state, removeListEntry('companyFull', 'test', 'holdings', '0', 'holders', '0'));
        state.companyFull.test.holdings['0'].holders.list.length.should.be.equal(1);
        state.companyFull.test.holdings['0'].holders.list[0].should.be.equal('1');
        done();
    });


});