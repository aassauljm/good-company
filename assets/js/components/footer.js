import React from 'react';
import { pureRender } from '../utils';


@pureRender
export default class Footer extends React.Component {
    render() {
        return <div className="footer">
            <div className="container">
            <p>© Copyright 2016 - CataLex®. All rights reserved.</p>
        </div>
        </div>
    }
}
