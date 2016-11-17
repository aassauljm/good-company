"use strict";
import React, { PropTypes } from 'react';
import { requestResource, deleteResource, companyTransaction, addNotification } from '../actions';
import { pureRender, stringToDate } from '../utils';
import { connect } from 'react-redux';
import ButtonInput from './forms/buttonInput';
import { Link } from 'react-router'
import STRINGS from '../strings'
import { asyncConnect } from 'redux-connect';
import LawBrowserContainer from './lawBrowserContainer'
import LawBrowserLink from './lawBrowserLink'
import classnames from 'classnames';
import { Documents as DocumentsForm } from './forms/documents';
import FormData from 'form-data';
import { enums as TransactionTypes } from '../../../config/enums/transactions';

@asyncConnect([{
  promise: ({store: {dispatch, getState}, params}) => {
    return dispatch(requestResource('documents'));
  }
}])
@connect(state => state.resources.documents)
export default class Documents extends React.Component {

    submitDelete(id, e) {
        e.preventDefault();
        this.props.dispatch(deleteResource('/document/' + id));
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
                <td><Link activeClassName="active" className="nav-link" to={`/document/view/${d.id}`} >View</Link></td>
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
                    return <tr key={i}><td><Link activeClassName="active" className="nav-link" to={`/companies/view/${this.key()}/document/view/${d.id}`}>{ d.filename }</Link></td><td>{stringToDate(d.date || d.createdAt)}</td></tr>
                }) }
                </tbody>
                </table>
        </div>
    }

    render() {
        return <div className="widget">
            <div className="widget-header">
                <div className="widget-title">
                    <span className="fa fa-files-o"/> File Cabinet
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

const documentTypeClasses = (type, filename) => {
    const map = {
        'Directory': 'fa fa-folder-o',
        'Companies Office': 'fa fa-file-text',
        'application/pdf': 'fa fa-file-pdf-o'
    };
    return map[type] || 'fa fa-file-text';
}


function RenderFile(props){
    const { item, link, push } = props;
    return (
      <div className="file-sub-tree">
          <span className="expand-control">
            { item.type === 'Directory' && props.children && props.showingSubTree && <span className="fa fa-minus-square-o" onClick={props.hideSubTree} /> }
            { item.type === 'Directory' && props.children && !props.showingSubTree && <span className="fa fa-plus-square-o" onClick={props.showSubTree} /> }
          </span>
          <span className={classnames('file', {selected: props.selected})} onClick={props.select}>
            <span className={'icon ' + documentTypeClasses(item.type)} />
            <span className="filename">{ item.filename }</span>
            { item.type !== 'Directory' && <span onClick={() => push(link)} className="view">View</span> }
            </span>
          { props.showingSubTree && props.children && <div className="children"> { props.children} </div> }
        </div>
    )
}

class FileTree extends React.Component {

    constructor(){
        super();
        this.state = {};
    }

    select(id) {
        this.setState({selected: id});
    }

    showSubTree(id) {
        this.setState({[id]: true});
    }

    hideSubTree(id) {
        this.setState({[id]: false});
    }

    render() {
        const loop = data => {
            return data.map((item) => {
                const link = item.companyId ? `/company/view/${item.companyId}/documents/view/${item.id}` : `/documents/view/${item.id}`;
                const props = {
                    key: item.id,
                    item: item,
                    link: link,
                    push: this.props.push,
                    select: () => this.select(item.id),
                    selected: this.state.selected === item.id,
                    showingSubTree: this.state[item.id],
                    showSubTree: () => this.showSubTree(item.id),
                    hideSubTree: () => this.hideSubTree(item.id)
                }
                if (item.children && item.children.length) {
                  return <RenderFile  {...props}>
                       { loop( item.children) }
                    </RenderFile>
                }
                return <RenderFile {...props} />;
            });

        };
        return <div className="file-tree">
                { loop(this.props.files) }
            </div>
    }
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
            map[d.directoryId].children.push(map[d.id]);
        }
    });
    return  roots;
}

@connect(undefined, {
    companyTransaction: (...args) => companyTransaction(...args),
    addNotification: (args) => addNotification(args)
})
export class CompanyDocuments extends React.Component {
    static propTypes = {
        companyState: PropTypes.object,
        companyId: PropTypes.string
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
                <td><Link activeClassName="active" className="nav-link" to={`/companies/view/${this.props.companyId}/document/view/${row.id}`}>View</Link></td>
            </tr>)}
        </tbody>
        </table>
    }

    upload(files) {
        const transactions = [{
            actions: [{transactionType: TransactionTypes.UPLOAD_DOCUMENT}],
            transactionType: TransactionTypes.UPLOAD_DOCUMENT,
            effectiveDate: new Date()
        }];
        this.props.companyTransaction(
                                    'compound',
                                    this.props.companyId,
                                    {transactions: transactions, documents: files, directoryId: null} )

            .then(() => {
                this.props.addNotification({message: 'File uploaded'});
            })

    }

    renderTree() {
        if(this.props.companyState.docList){
            return  <div>
                <FileTree files={listToTree(this.props.companyState.docList.documents)} push={this.props.push}/>

                <DocumentsForm documents={{onChange: (files) => this.upload(files)}} />
            </div>
        }
    }

    render() {
        return <LawBrowserContainer lawLinks={documentLawLinks()}>
            <div className="widget">
                <div className="widget-header">
                    <div className="widget-title">
                        <span className="fa fa-files-o"/> File Cabinet
                    </div>
                </div>
                <div className="widget-body documents">
                    { this.renderTree() }
                </div>
            </div>
            </LawBrowserContainer>
    }
}


