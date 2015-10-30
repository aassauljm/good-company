import React from 'react';
import { Provider } from 'react-redux';
import routes from "./routes"
import configureStore from './store';

const store = configureStore();

export default class Root extends React.Component {
  render() {
    return (
      <Provider store={store}>
        { routes }
        </Provider>
    );
  }
}
