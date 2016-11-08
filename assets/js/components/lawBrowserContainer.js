"use strict";
import React, {PropTypes} from 'react';
import { connect } from 'react-redux';
import STRINGS from '../strings';
import AutoAffix from 'react-overlays/lib/AutoAffix'


class Law extends React.Component {
    constructor(){
        super();
        this.state = {};
    }

    render() {
        let sizeClass = '';
        if(this.state.expanded){
            sizeClass = 'expanded';
        }
        return <div className={"widget law-browser " + sizeClass}>
                        <div className="widget-header">
                            <div className="widget-title">
                                Law Browser
                            </div>
                            <div className="widget-control">
                                <span className="actionable" onClick={() => this.setState({expanded: !this.state.expanded})}>
                                    {this.state.expanded ? 'Hide': 'View All'}
                                </span>
                            </div>
                        </div>
                        <div className="widget-body">
                            <div className="link-sea">
                                { this.props.children }
                            </div>
                        </div>
                </div>
    }
}

class AffixedLaw extends React.Component {
    render() {
        return <AutoAffix viewportOffsetTop={15} {...this.props}>
            <div>
                <Law>
                    { this.props.children}
                </Law>
            </div>
        </AutoAffix>
    }
}

export default class LawBrowserContainer extends React.Component {

    render(){
        return <div className="container">
            <div className="row" ref="affixContainer">
                <div className="col-md-12 col-lg-3 col-lg-push-9">
                    <AffixedLaw container={() => this.refs.affixContainer}>
                        {this.props.lawLinks}
                    </AffixedLaw>
                </div>
                <div className="col-md-12 col-lg-9 col-lg-pull-3">
                    { this.props.children }
                </div>
            </div>
        </div>
    }
}