"use strict";
import React from 'react';
import {requestResource, updateResource, createResource} from '../actions';
import { pureRender, objectValues, stringToDate } from '../utils';
import { connect } from 'react-redux';
import { initialize } from 'redux-form';
import { Link } from 'react-router';
import { fieldStyle } from '../utils';
import AutoAffix from 'react-overlays/lib/AutoAffix'


@connect((state, ownProps) => state.resources['/document/'+ownProps.params.id ] || {data: {}})
export default class Document extends React.Component {

    key(){
        return this.props.params.id
    }

    componentDidMount(){
        this.props.dispatch(requestResource('/document/'+this.key()));
    }

    componentDidUpdate(){
        this.props.dispatch(requestResource('/document/'+this.key()));
    }

    isOwnAccount(){
        return this.key() === this.props.id+'';
    }

    renderDetails() {
        return <div className={"widget"}>
                <div className="widget-header">
                    <div className="widget-title">
                        File Details
                    </div>
                </div>
                <div className="widget-body">
                     <dl>
                          <dt>ID</dt>
                          <dd>{data.id}</dd>
                          <dt>Filename</dt>
                          <dd>{data.filename}</dd>
                          <dt>Type</dt>
                          <dd>{data.type}</dd>
                          { data.date && <dt>Date</dt> }
                          { data.date && <dd>{ new Date(data.date).toDateString() }</dd> }
                          <dt>Date Imported</dt>
                          <dd>{stringToDate(data.createdAt)}</dd>
                          { data.sourceUrl && <dt>Original URL</dt> }
                          { data.sourceUrl && <dd><Link target="_blank" to={data.sourceUrl}>Companies Office</Link> </dd> }
                        </dl>
                          <div className="button-row">{ !data.sourceUrl && <Link target="_blank" className="btn btn-primary" to={`/api/document/get_document/${this.key()}`}>Download</Link> }</div>
                </div>
        </div>
    }
    render(){
        return <div className="container">
            <div className="row" ref="affixContainer">
                <div className="col-md-12 col-lg-3 col-lg-push-9">
                    <AutoAffix viewportOffsetTop={15} container={() => this.refs.affixContainer}>
                        { this.renderDetails() }
                    </AutoAffix>
                </div>
                <div className="col-md-12 col-lg-9 col-lg-pull-3">
                     <img className="image-loading" src={"/api/document/get_document_preview/"+ this.key()} />

                </div>
            </div>
        </div>
    }
}