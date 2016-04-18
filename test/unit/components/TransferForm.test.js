import React from 'react';
import Promise from "bluebird";
import { validate, createHoldingMap, transferFormatSubmit, TransferConnected } from '../../../assets/js/components/transactions/transfer';
import { simpleStore, waitFor } from '../../integration/helpers';
import TestUtils from 'react/lib/ReactTestUtils';
import { Provider } from 'react-redux';
import chai from 'chai';
const should = chai.should();


describe('Transfer form', () => {
    const holdingMap = {1: [{amount: 1, shareClass: null}], 2: [{amount: 2, shareClass: 2}], 3: [{amount: 3, shareClass: 3}]}

    const companyState = {
        holdingList: {holdings: [
            {holdingId: 1, parcels: [{amount: 1}]},
            {holdingId: 2, parcels: [{amount: 2, shareClass: 2}]},
            {holdingId: 3, parcels: [{amount: 3, shareClass: 3}]},
            ]}
    };


    describe('holding map',  () => {
        it('confirms holding map structured correctly', done => {
            createHoldingMap(companyState).should.deep.eql(holdingMap);
            done();
        });
    });

    describe('validation',  () => {
        it('confirms validate fails from empty values', done => {
            const values = {parcels: []}
            const errors = validate(values, {holdingMap: holdingMap});
            errors.effectiveDate.length.should.be.equal(1);
            errors.from.length.should.be.equal(1);
            errors.to.length.should.be.equal(1);
            errors._error.length.should.be.equal(1);
            done();
        });

        it('confirms validate fails, self transfer, wrong shareClass', done => {
            const values = {effectiveDate: new Date(), from: '1', to: '1', parcels: [{amount: '1', shareClass: '1'}]}
            const errors = validate(values, {holdingMap: holdingMap});
            should.equal(errors.from, undefined);
            should.equal(errors._error, undefined);
            errors.to.length.should.be.equal(1);
            errors.parcels[0].shareClass.length.should.be.equal(1);
            done();
        });

        it('confirms validate fails, wrong shareClass', done => {
            const values = {effectiveDate: new Date(), from: '2', to: '3', parcels: [{amount: '1', shareClass: '1'}]}
            const errors = validate(values, {holdingMap: holdingMap});
            should.equal(errors.from, undefined);
            should.equal(errors.to, undefined);
            should.equal(errors._error, undefined);
            errors.parcels[0].shareClass.length.should.be.equal(1);
            done();
        });

        it('confirms validate fails, bad parcel amount', done => {
            const values = {effectiveDate: new Date(), from: '2', to: '3', parcels: [{amount: 'asdf', shareClass: '2'}]}
            const errors = validate(values, {holdingMap: holdingMap});
            should.equal(errors.from, undefined);
            should.equal(errors.to, undefined);
            should.equal(errors._error, undefined);
            should.equal(errors.parcels[0].shareClass, undefined);
            errors.parcels[0].amount.length.should.be.equal(1);
            done();
        });

        it('confirms validate fails, insufficient parcel amount', done => {
            const values = {effectiveDate: new Date(), from: '2', to: '3', parcels: [{amount: '3', shareClass: '2'}]}
            const errors = validate(values, {holdingMap: holdingMap});
            should.equal(errors.from, undefined);
            should.equal(errors.to, undefined);
            should.equal(errors._error, undefined);
            should.equal(errors.parcels[0].shareClass, undefined);
            errors.parcels[0].amount.length.should.be.equal(1);
            done();
        });

        it('confirms validate succeeds', done => {
            const values = {effectiveDate: new Date(), from: '3', to: '2', parcels: [{amount: '1', shareClass: '3'}]}
            const errors = validate(values, {holdingMap: holdingMap});
            errors.should.be.deep.eql({parcels: [{}]})
            done();
        });

        it('confirms validate succeeds, newHolding', done => {
            const values = {effectiveDate: new Date(), from: '3', newHolding: {persons: [{name: 'x'}]}, parcels: [{amount: '1', shareClass: '3'}]}
            const errors = validate(values, {holdingMap: holdingMap});
            errors.should.be.deep.eql({parcels: [{}]})
            done();
        });

    });

    describe('submit formatting',  () => {
        it('confirms validate succeeds', done => {
            const values = {effectiveDate: new Date(), from: '3', to: '2', parcels: [{amount: '1', shareClass: '3'}]}
            const submit = transferFormatSubmit(values, companyState);
            submit[0].should.be.deep.eql({
                effectiveDate: values.effectiveDate,
                transactionType: 'TRANSFER',
                actions: [
                    {
                        holdingId: 3,
                        shareClass: 3,
                        amount: 1,
                        beforeAmount: 3,
                        afterAmount: 2,
                        transactionType: 'TRANSFER_FROM',
                        transactionMethod: 'AMEND'
                    },
                    {
                        holdingId: 2,
                        shareClass: 3,
                        amount: 1,
                        beforeAmount: 0,
                        afterAmount: 1,
                        transactionType: 'TRANSFER_TO',
                        transactionMethod: 'AMEND'
                    }
                ]
            });
            done();
        });

        it('confirms validate succeeds, new holder', done => {
            const values = {effectiveDate: new Date(), from: '3', newHolding: {persons: [{name: 'new guy'}]}, parcels: [{amount: '1', shareClass: '3'}]}
            const submit = transferFormatSubmit(values, companyState);
            submit.should.be.deep.eql([{
                effectiveDate: values.effectiveDate,
                transactionType: "TRANSFER",
                actions: [{
                    transactionType: 'NEW_ALLOCATION',
                    holders: [{name: 'new guy'}],
                    name: undefined
                }]
            },{
                effectiveDate: values.effectiveDate,
                transactionType: 'TRANSFER',
                actions: [
                    {
                        holdingId: 3,
                        shareClass: 3,
                        amount: 1,
                        beforeAmount: 3,
                        afterAmount: 2,
                        transactionType: 'TRANSFER_FROM',
                        transactionMethod: 'AMEND'
                    },
                    {
                        holders: [{name: 'new guy'}],
                        shareClass: 3,
                        amount: 1,
                        beforeAmount: 0,
                        afterAmount: 1,
                        transactionType: 'TRANSFER_TO',
                        transactionMethod: 'AMEND'
                    }
                ]
            }]);
            done();
        });
    });

    describe('Connected form component', () => {
        it('check validation error feedback', (done) => {
            const store = simpleStore();
            const holdingOptions = [
                <option key={0} value={1}/>,
                <option key={1} value={2}/>
            ];
            const shareOptions = holdingOptions;
            const form = TestUtils.renderIntoDocument(
                <Provider store={store}>
                    <TransferConnected
                        initialValues={{parcels: [{}], effectiveDate: new Date() }}
                        holdingOptions={holdingOptions}
                        holdingMap={holdingMap}
                        shareOptions={shareOptions}
                        />
                </Provider> );
            const [fromSelect, toSelect] = TestUtils.scryRenderedDOMComponentsWithTag(form, 'select');
            TestUtils.scryRenderedDOMComponentsWithClass(form, 'help-block').length.should.be.eql(0);
            toSelect.value = '1';
            TestUtils.Simulate.change(toSelect);
            fromSelect.value = '1';
            TestUtils.Simulate.change(fromSelect);
            TestUtils.Simulate.blur(toSelect);


            //TODO in morning,
            waitFor('Error to display', () => TestUtils.scryRenderedDOMComponentsWithClass(form, 'help-block').length)
                .then(() => {
                    TestUtils.scryRenderedDOMComponentsWithClass(form, 'help-block').length.should.be.eql(1);
                    toSelect.value = '2';
                    TestUtils.Simulate.change(toSelect);
                    return waitFor('Error to disappear', () => {
                        return !TestUtils.scryRenderedDOMComponentsWithClass(form, 'help-block').length
                    });
                })
                .then(() => {
                    done();
                })
                .catch(done)

        })
    });
});