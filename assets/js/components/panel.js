import React from 'react';
import Button from 'react-bootstrap/lib/Button';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';

export default class Panel extends React.Component {
    render() {
        return <div className={"panel panel-"+(this.props.panelType || 'default')} >
            <div className="panel-heading">
                { this.props.title }
                <Button className="close" aria-label="Close" onClick={() => this.props.remove() }><Glyphicon glyph="remove" /></Button>
            </div>
            <div className="panel-body">
                { this.props.children }
            </div>
        </div>
    }
}

