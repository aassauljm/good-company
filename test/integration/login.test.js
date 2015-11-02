import React from 'react';
import Promise from "bluebird";
import {
  renderIntoDocument,
  findRenderedComponentWithType,
  findRenderedDOMComponentWithTag,
  Simulate
} from 'react-addons-test-utils';
import {configureHistoriedStore} from ".../../../../assets/js/serverStore";
import Root from ".../../../../assets/js/root";
import { match } from 'redux-router/server';

function renderApp(){
    const store = configureHistoriedStore();
    return renderIntoDocument(<Root store={store}/>);

}

describe('Renders full ', () => {
    it('gets log in menu', done => {
        const tree = renderApp(done);
        done();
   });
});