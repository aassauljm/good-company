"use strict";
import React from 'react';

export default class Landing extends React.Component {
   // static propTypes = { login: React.PropTypes.object.isRequired };
    render() {
        return  <div {...this.props.login} />
    }
}

