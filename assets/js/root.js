import React from 'react';
import { Provider } from 'react-redux';
import routes from "./routes"
import { Router } from 'react-router'
import { ReduxAsyncConnect } from 'redux-connect';

export default class Root extends React.Component {
  render() {
    return (
      <Provider store={this.props.store}>
            <Router render={(props) =>
                <ReduxAsyncConnect {...props} />
              } history={this.props.history}>
                { routes(this.props.store) }
                { this.props.children }
            </Router>
        </Provider>
    );
  }
}
