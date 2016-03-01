import React from 'react';
import { Provider } from 'react-redux';
import routes from "./routes"
import { Router } from 'react-router'
import { ReduxAsyncConnect } from 'redux-async-connect';

export default class Root extends React.Component {
  render() {
    return (
      <Provider store={this.props.store}>
            <Router render={(props) =>
                <ReduxAsyncConnect {...props} filter={item => !item.deferred} />
              } history={this.props.history}>
                { routes(this.props.store) }
                { this.props.children }
            </Router>
        </Provider>
    );
  }
}
