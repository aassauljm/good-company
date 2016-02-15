import React from 'react';
import { Provider } from 'react-redux';
import routes from "./routes"
import { Router } from 'react-router'


export default class Root extends React.Component {
  render() {
    return (
      <div>
      <Provider store={this.props.store}>
        <div>
            <Router history={this.props.history}>
                { routes }
                { this.props.children }
            </Router>
        </div>
        </Provider>
        </div>
    );
  }
}
