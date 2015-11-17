import React from 'react';
import { Provider } from 'react-redux';
import routes from "./routes"


export default class Root extends React.Component {
  render() {
    return (
      <div>
      <Provider store={this.props.store}>
        <div>
            { routes }
            { this.props.children }
        </div>
        </Provider>
        </div>
    );
  }
}
