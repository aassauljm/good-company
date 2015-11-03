import React from 'react';
import { Provider } from 'react-redux';
import routes from "./routes"


export default class Root extends React.Component {
  render() {
    return (
      <Provider store={this.props.store}>
        { routes }
        </Provider>
    );
  }
}
