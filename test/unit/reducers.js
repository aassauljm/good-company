import {form} from '../../assets/js/reducers';
import {startCreateCompany, endCreateCompany, addListEntry, removeListEntry} from '../../assets/js/actions';
import {initialize} from 'redux-form/lib/actions';
var chai = require('chai'),
    should = chai.should();

describe('Form reducers', () => {
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

    describe('Confirms the destruction of removed subforms', () => {
        it('Initializes subform, removes it, confirms destruction', done => {
            let state = {};
            state = form(state, startCreateCompany('test'));
            state = form(state, {form: 'person', key: ['test', 'directors', '0'].join('.'), ...initialize()});
            state.person[['test', 'directors', '0'].join('.')].should.be.an('object');
            state = form(state, removeListEntry('companyFull', 'test', 'directors', '0'));
            should.not.exist(state.person[['test', 'directors', '0'].join('.')]);
            done();
        });
        it('Same again but with subsubform Initializes subform', done => {
            let state = {};
            state = form(state, startCreateCompany('test'));
            state = form(state, {form: 'person', key: ['test', 'directors', '0'].join('.'), ...initialize()});
            state.person[['test', 'directors', '0'].join('.')].should.be.an('object');
            state = form(state, removeListEntry('companyFull', 'test', 'directors', '0'));
            should.not.exist(state.person[['test', 'directors', '0'].join('.')]);
            done();
        });
    });

    describe('Loads data into form', () => {
        it('Initializes companyFull with data', done => {
            let state = {};
            state = form(state, startCreateCompany('test',
                         {companyName: 'test company',
                         holdings: [{
                            holders: [{name: 'john'}],
                            parcels: [{amount: 10}]
                        },{
                            holders: [{name: 'bill'}],
                            parcels: [{amount: 100}]
                        }],
                         directors: [{
                            name: 'mike',
                            address: 'home'
                         }]
                     }));
            should.exist(state.person[['test', 'directors', '0'].join('.')]);
            should.exist(state.parcel[['test', 'holdings', '0', 'parcels', '0'].join('.')]);
            should.exist(state.person[['test', 'holdings', '0', 'holders', '0'].join('.')]);
            should.exist(state.person[['test', 'holdings', '1', 'holders', '0'].join('.')]);
            done();
        });
    });

    describe('End form action cleans up form data', () => {
        it('Initializes subform, adds data, removes it, confirms destruction', done => {
            let state = {};
            state = form(state, startCreateCompany('test',
                         {companyName: 'test company',
                         holdings: [{
                            holders: [{name: 'john'}],
                            parcels: [{amount: 10}]
                        },{
                            holders: [{name: 'bill'}],
                            parcels: [{amount: 100}]
                        }],
                         directors: [{
                            name: 'mike',
                            address: 'home'
                         }]
                     }))
            state = form(state, endCreateCompany('test'));
            should.not.exist(state.person[['test', 'directors', '0'].join('.')]);
            should.not.exist(state.parcel[['test', 'holdings', '0', 'parcels', '0'].join('.')]);
            should.not.exist(state.shareClass[['test', 'shareClasses', '0'].join('.')]);
            done();
        });
    });
});