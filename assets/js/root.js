import React from 'react';
import { Provider } from 'react-redux';
import routes from "./routes"
import DevTools from './components/devTools'

export default class Root extends React.Component {
  render() {
    return (
      <div>
      <Provider store={this.props.store}>
        <div>
            { routes }
            { __DEV__  ?  <DevTools /> : null }
        </div>
        </Provider>
        </div>
    );
  }
}
