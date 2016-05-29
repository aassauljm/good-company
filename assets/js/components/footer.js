import React from 'react';
import { pureRender } from '../utils';


@pureRender
export default class Footer extends React.Component {
    render() {
        return <div className="footer">
            © Copyright 2016 - CataLex Limited. All rights reserved.
        </div>
    }
}
