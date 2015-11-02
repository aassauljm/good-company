import React from 'react';
import Promise from "bluebird";
import {PasswordForm} from '../../../assets/js/components/setPassword';
import TestUtils from 'react/lib/ReactTestUtils';

describe('Tests setPassword form', () => {
    it('test form renders and submits', done => {
        let store = {
            fields: {
                newPassword: {},
                oldPassword: {},
                repeatPassword: {}
            }
        };
        let form = TestUtils.renderIntoDocument(<PasswordForm {...store} submit={() => done() }/>);
        TestUtils.Simulate.submit(TestUtils.findRenderedDOMComponentWithTag(form, 'form'));
    });
});