import { Route, Router, DefaultRoute } from 'react-router';
import React from 'react';
import Header from './header';

export default class App extends React.Component {
    render() {
        return  <div>
            <Header />
             { this.props.children }
        </div>
    }
}
