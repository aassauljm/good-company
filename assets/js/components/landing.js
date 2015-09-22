"use strict";
import React from 'react';
import pureRender from 'pure-render-decorator';


@pureRender
export default class Landing extends React.Component {
   // static propTypes = { login: React.PropTypes.object.isRequired };
    render() {
        return  <div {...this.props.login} />
    }
}

