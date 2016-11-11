"use strict";
import React, { PropTypes } from 'react';
import { requestResource, deleteResource } from '../actions';
import { pureRender, stringToDate } from '../utils';
import { connect } from 'react-redux';
import ButtonInput from './forms/buttonInput';
import { Link } from 'react-router'
import STRINGS from '../strings'
import { asyncConnect } from 'redux-connect';
import LawBrowserContainer from './lawBrowserContainer'
import LawBrowserLink from './lawBrowserLink'
import Tree, { TreeNode } from 'rc-tree';
import classnames from 'classnames';

@asyncConnect([{
  promise: ({store: {dispatch, getState}, params}) => {
    return dispatch(requestResource('documents'));
  }
}])
@connect(state => state.resources.documents)
export default class Documents extends React.Component {

    submitDelete(id, e) {
        e.preventDefault();
        this.props.dispatch(deleteResource('/document/'+id));
         // then reload
    }

    render() {
        let fields = ['id', 'filename', 'type', 'createdAt', 'updatedAt'];
        return <div className="container"><table className="table">
        <thead><tr>{ fields.map(f => <th key={f}>{f}</th>) }<th></th></tr></thead>
        <tbody>
        {this.props.data ? this.props.data.map(
            (row, i) => <tr key={i}>
                { fields.map(f => <td key={f}>{row[f]}</td>) }
                <td><Link activeClassName="active" className="nav-link" to={"/document/view/"+row.id} >View</Link></td>
                { /*<td><a href="#" type='button' value='Delete' onClick={this.submitDelete.bind(this, row.id)}  >Delete</a></td> */}
            </tr>)

        : null}
        </tbody>
        </table>
        </div>
    }
}




@pureRender
export class DocumentsWidget extends React.Component {
    key() {
        return this.props.companyId;
    }
    renderBody() {
        let bodyClass = "widget-body expandable ";
        if(this.props.expanded){
            bodyClass += "expanded ";
        }

        const docList = this.props.companyState.docList || [];
        return  <div className="widget-body"  className={bodyClass} onClick={() => this.props.toggle(!this.props.expanded)}>
                <table className="table table-condensed" style={{marginBottom: 0}}>
                <thead><tr><th>Name</th><th>Date</th></tr></thead>
                <tbody>
                { (docList.documents || []).map((d, i) => {
                    return <tr key={i}><td><Link activeClassName="active" className="nav-link" to={"/document/view/"+d.id}>{ d.filename }</Link></td><td>{stringToDate(d.date)}</td></tr>
                }) }
                </tbody>
                </table>
        </div>
    }

    render() {
        return <div className="widget">
            <div className="widget-header">
                <div className="widget-title">
                    File Cabinet
                </div>
                <div className="widget-control">
                 <Link to={`/company/view/${this.key()}/documents`} >View All</Link>
                </div>
            </div>
            { this.renderBody() }
        </div>
    }
}


function documentLawLinks(){
    return <div>
           <LawBrowserLink title="Companies Act 1993" location="s 189(1)-(3)" >Records a company must keep </LawBrowserLink>
           <LawBrowserLink title="Companies Act 1993" location="s 189(4)" >Notice to registrar of place of records</LawBrowserLink>
           <LawBrowserLink title="Companies Act 1993" location="s 189(5), 373(2)(g), and 374(2)(1)" >Consequences of non-compliance</LawBrowserLink>
           <LawBrowserLink title="Companies Act 1993" location="s 190" >Form of Records</LawBrowserLink>
           <LawBrowserLink title="Companies Act 1993" location="s 191" >Inspection of records by directors</LawBrowserLink>
           <LawBrowserLink title="Companies Act 1993" location="s 215, 217 and 218" >Inspection of records by the public</LawBrowserLink>
           <LawBrowserLink title="Companies Act 1993" location="s 216, 217, and 218" >Inspection of records by shareholders</LawBrowserLink>
           <LawBrowserLink title="Companies Act 1993" location="s 194" >Accounting records must be kept</LawBrowserLink>
           <LawBrowserLink title="Companies Act 1993" location="s 195" >Place of accounting records</LawBrowserLink>
    </div>
}

const documentTypeImages = (type) => {
    const map = {
        'Companies Office': '/images/companies-office-logo.png'
    };
    return map[type] || '/images/document-placeholder.png'
}

function RenderFile(node){
    return (
      <span className={classnames('document', {})} onClick={() => {}} >
        {/*<img src={documentTypeImages(node.type)} />*/}
        {node.filename}
        { node.type !== 'Directory' && <Link activeClassName="active" className="nav-link" to={"/document/view/"+node.id}>View</Link> }
      </span>
    )
}

function listToTree(documents){
    const roots = [];
    const map = documents.reduce((acc, d) => {
        acc[d.id] = {...d, children: []};
        return acc;
    }, {});
    documents.map(d => {
        if(!d.directoryId){
            roots.push(map[d.id]);
        }
        else{
            map[d.directoryId].children.push(d);
        }
    });
    return  roots;
}

export class CompanyDocuments extends React.Component {
    static propTypes = {
        companyState: PropTypes.object
    };

    renderField(key, value) {
        switch(key){
            case 'date':
            case 'createdAt':
                return stringToDate(value);
            default:
                return value;
        }
    }

    renderTable() {
        const docList = this.props.companyState.docList;
        let fields = ['id', 'filename', 'type', 'date', 'createdAt'];
        return <table className="table table-hover table-striped">
        <thead><tr>{ fields.map(f => <th key={f}>{STRINGS.companyDocuments[f]}</th>) }<th></th></tr></thead>
        <tbody>
        { docList.documents.map(
            (row, i) => <tr key={i}>
                { fields.map(f => <td key={f}>{this.renderField(f, row[f])}</td>) }
                <td><Link activeClassName="active" className="nav-link" to={"/document/view/"+row.id} >View</Link></td>
            </tr>)}
        </tbody>
        </table>
    }

    renderTree() {
         const loop = data => {
          return data.map((item) => {
            if (item.children && item.children.length) {
              return <TreeNode key={item.id} title={RenderFile(item)}>{loop(item.children)}</TreeNode>;
            }
            return <TreeNode key={item.id} title={RenderFile(item)} />;
          });
        };
        return  <div>
            <Tree
            classNames={''}
            draggable
            renderNode={RenderFile}>
                {loop(listToTree(this.props.companyState.docList.documents))}
            </Tree>
            </div>
    }

    render() {
        return <LawBrowserContainer lawLinks={documentLawLinks()}>
            <div className="widget">
                <div className="widget-header">
                    <div className="widget-title">
                        File Cabinet
                    </div>
                </div>
                <div className="widget-body documents">
                    { this.renderTree() }
                </div>
            </div>
            </LawBrowserContainer>
    }
}


