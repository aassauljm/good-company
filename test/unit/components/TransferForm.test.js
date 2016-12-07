"use strict";
import React from 'react';
import Promise from "bluebird";
import { validate, createHoldingMap, transferFormatSubmit, TransferConnected } from '../../../assets/js/components/transactions/transfer';
import { ParcelWithRemove } from '../../../assets/js/components/forms/parcel';
import Input from '../../../assets/js/components/forms/input';
import { simpleStore } from '../../integration/helpers';
import TestUtils, { Simulate } from 'react/lib/ReactTestUtils';
import { Provider } from 'react-redux';
import chai from 'chai';
import { DragDropContext } from 'react-dnd';
import TestBackend from 'react-dnd-test-backend';


const should = chai.should();

function wrapInTestContext(DecoratedComponent) {
  return DragDropContext(TestBackend)(
    class TestContextContainer extends React.Component {
      render() {
        return <DecoratedComponent {...this.props} />;
      }
    }
  );
}


describe('Transfer form', () => {

    const holdingMap = {1: [{amount: 1, shareClass: null}], 2: [{amount: 2, shareClass: 2},{amount: 1, shareClass: 4}], 3: [{amount: 3, shareClass: 3}]}
    const companyState = {
        holdingList: {holdings: [
            {holdingId: 1, parcels: [{amount: 1}]},
            {holdingId: 2, parcels: [{amount: 2, shareClass: 2},{amount: 1, shareClass: 4}]},
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
            submit[0].should.containSubset({
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
            submit.should.containSubset([{
                effectiveDate: values.effectiveDate,
                transactionType: "NEW_ALLOCATION",
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
        let form, submitResult

        beforeEach(() => {
            const store = simpleStore();
            const holdingOptions = [
                <option key={0} value={1}/>,
                <option key={1} value={2}/>
            ];
            const shareOptions = holdingOptions;
            const TransferWrapped = wrapInTestContext(TransferConnected);

            form = TestUtils.renderIntoDocument(<Provider store={store}>
                    <TransferWrapped
                        initialValues={{parcels: [{}], effectiveDate: new Date() }}
                        holdingOptions={holdingOptions}
                        holdingMap={holdingMap}
                        shareOptions={shareOptions}
                        onSubmit={(data) => { submitResult = data}}
                        />
                </Provider>);
        });

        context('check validation', () => {

            it('to and from same target', (done) => {
                const [fromSelect, toSelect] = TestUtils.scryRenderedDOMComponentsWithTag(form, 'select');
                TestUtils.scryRenderedDOMComponentsWithClass(form, 'help-block').length.should.be.eql(0);

                fromSelect.value = '1';
                Simulate.change(fromSelect);

                toSelect.value = '1';
                Simulate.change(toSelect);

                Simulate.blur(toSelect);

                TestUtils.scryRenderedDOMComponentsWithClass(form, 'help-block').length.should.be.eql(1);
                toSelect.value = '2';
                Simulate.change(toSelect);
                TestUtils.scryRenderedDOMComponentsWithClass(form, 'help-block').length.should.be.eql(0);
                done();
            });

            it('from has insufficent amount', (done) => {
                const [fromSelect] = TestUtils.scryRenderedDOMComponentsWithTag(form, 'select');
                const [parcel] = TestUtils.scryRenderedComponentsWithType(form, ParcelWithRemove)
                const [amountInput, shareClassInput] = TestUtils.scryRenderedComponentsWithType(parcel, Input);
                const amount = TestUtils.findRenderedDOMComponentWithTag(amountInput, 'input');
                const shareClass = TestUtils.findRenderedDOMComponentWithTag(shareClassInput, 'select');

                fromSelect.value = '2';
                Simulate.change(fromSelect);

                amount.value = '100';
                Simulate.change(amount);
                Simulate.blur(amount);
                Simulate.blur(shareClass);

                // Has no shares of this class
                TestUtils.scryRenderedDOMComponentsWithClass(shareClassInput, 'help-block').length.should.be.eql(1);

                shareClass.value = '2';
                Simulate.change(shareClass);
                Simulate.blur(shareClass);

                // Has shares of this class, but not enough
                TestUtils.scryRenderedDOMComponentsWithClass(shareClassInput, 'help-block').length.should.be.eql(0);
                TestUtils.scryRenderedDOMComponentsWithClass(amountInput, 'help-block').length.should.be.eql(1);

                // Lower amount so valid
                amount.value = '1';
                Simulate.change(amount);
                TestUtils.scryRenderedDOMComponentsWithClass(amountInput, 'help-block').length.should.be.eql(0);
                done();
            });

            it('duplicate shareClasses', (done) => {
                const [fromSelect] = TestUtils.scryRenderedDOMComponentsWithTag(form, 'select');

                fromSelect.value = '2';
                Simulate.change(fromSelect);

                // add parcel
                Simulate.click(TestUtils.findRenderedDOMComponentWithClass(form, 'add-parcel'));

                let parcels = TestUtils.scryRenderedComponentsWithType(form, ParcelWithRemove);
                parcels.length.should.be.equal(2);


                const [amountInput2, shareClassInput2] = TestUtils.scryRenderedComponentsWithType(parcels[1], Input);
                const shareClass2 = TestUtils.findRenderedDOMComponentWithTag(shareClassInput2, 'select');
                Simulate.blur(shareClass2);

                // Duplicate shares of this class
                TestUtils.scryRenderedDOMComponentsWithClass(shareClassInput2, 'help-block').length.should.be.eql(1);
                shareClass2.value = '2'
                Simulate.change(shareClass2);
                TestUtils.scryRenderedDOMComponentsWithClass(shareClassInput2, 'help-block').length.should.be.eql(0);

                // Remove Parcel
                Simulate.click(TestUtils.findRenderedDOMComponentWithClass(parcels[0], 'remove-parcel'));

                parcels = TestUtils.scryRenderedComponentsWithType(form, ParcelWithRemove);
                parcels.length.should.be.equal(1);

                const [amountInput, shareClassInput] = TestUtils.scryRenderedComponentsWithType(parcels[0], Input);

                // No longer duplicate error
                TestUtils.scryRenderedDOMComponentsWithClass(shareClassInput, 'help-block').length.should.be.eql(0);
                done();
            });

            it('no parcels', (done) => {
                let parcel = TestUtils.findRenderedComponentWithType(form, ParcelWithRemove);
                TestUtils.scryRenderedDOMComponentsWithClass(form, 'alert').length.should.be.eql(0);
                // Remove Parcel
                Simulate.click(TestUtils.findRenderedDOMComponentWithClass(parcel, 'remove-parcel'));

                TestUtils.scryRenderedComponentsWithType(form, ParcelWithRemove).length.should.be.equal(0);

                TestUtils.scryRenderedDOMComponentsWithClass(form, 'alert').length.should.be.eql(1);

                // add parcel
                Simulate.click(TestUtils.findRenderedDOMComponentWithClass(form, 'add-parcel'));
                TestUtils.scryRenderedDOMComponentsWithClass(form, 'alert').length.should.be.eql(0);
                done();
            });
        });

        context('creates valid transfer', () => {
            it('basic transfer filled out, confirm transaction data', (done) => {
                const [fromSelect, toSelect] = TestUtils.scryRenderedDOMComponentsWithTag(form, 'select');

                fromSelect.value = '2';
                Simulate.change(fromSelect);

                toSelect.value = '1';
                Simulate.change(toSelect);

                const [parcel] = TestUtils.scryRenderedComponentsWithType(form, ParcelWithRemove)
                const [amountInput, shareClassInput] = TestUtils.scryRenderedComponentsWithType(parcel, Input);
                const amount = TestUtils.findRenderedDOMComponentWithTag(amountInput, 'input');
                const shareClass = TestUtils.findRenderedDOMComponentWithTag(shareClassInput, 'select');

                amount.value = '2';
                Simulate.change(amount);
                shareClass.value = '2';
                Simulate.change(shareClass);

                const transferComponent = TestUtils.findRenderedComponentWithType(form, TransferConnected);


                transferComponent.submit();
                submitResult.should.containSubset({
                      from: '2',
                      to: '1',
                      newHolding: undefined,
                      parcels: [ { shareClass: '2', amount: 2 } ],
                      documents: undefined })
                done();
            });

        });

    });
});
