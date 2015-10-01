import 'babel-core/polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import "../styles/style.scss";
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

let mountNode = document.getElementById("main");
if (mountNode)
    ReactDOM.render(<Root />, mountNode);


