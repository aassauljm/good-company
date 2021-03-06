"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import { requestResource, softDeleteResource, updateResource, createResource, companyTransaction, addNotification, showLoading, endLoading } from '../actions';
import { pureRender, stringDateToFormattedString } from '../utils';
import { connect } from 'react-redux';
import ButtonInput from './forms/buttonInput';
import Button from 'react-bootstrap/lib/Button';
import Input from './forms/input';
import { Link } from 'react-router'
import STRINGS from '../strings'
import { asyncConnect } from 'redux-connect';
import LawBrowserContainer from './lawBrowserContainer'
import LawBrowserLink from './lawBrowserLink'
import classnames from 'classnames';
import { Documents as DocumentsForm } from './forms/documents';
import FormData from 'form-data';
import { enums as TransactionTypes } from '../../../config/enums/transactions';
import { DragSource, DropTarget } from 'react-dnd';
import Loading from './loading';
import { NativeTypes } from 'react-dnd-html5-backend';
import firstBy from 'thenby';
import { DocumentsHOCFromRoute, DocumentsHOC } from '../hoc/resources';
import Widget from './widget';




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
                <td><Link activeClassName="active" className="nav-link" to={`/company/view/${this.props.companyId}/document/view/${d.id}`} >View</Link></td>
                { /*<td><a href="#" type='button' value='Delete' onClick={this.submitDelete.bind(this, row.id)}  >Delete</a></td> */}
            </tr>)

        : null}
        </tbody>
        </table>
        </div>
    }
}


const documentTypeClasses = (doc, showingSubTree) => {
    const map = {
        'Directory': 'fa fa-folder-o',
        'Companies Office': 'fa fa-file-text',
        'image/png': 'fa fa-file-image-o',
        'image/jpeg': 'fa fa-file-image-o',
        'application/pdf': 'fa fa-file-pdf-o',
        'application/msword': 'fa fa-file-word-o',
        'application/gzip': 'fa-file-archive-o',
        'application/zip': 'fa-file-archive-o'
    };

    if(doc.type === 'Directory'){
        if(doc.userUploaded){
            if(showingSubTree){
                return 'fa fa-folder-open-o'
            }
            return 'fa fa-folder-o'
        }
        if(showingSubTree){
            return 'fa fa-folder-open'
        }
        return 'fa fa-folder';
    }

    return map[doc.type] || 'fa fa-file-text';
}


@DocumentsHOC()
export class DocumentsWidget extends React.PureComponent {

    renderBody() {
        const companyStateDocs = (this.props.companyState.docList && this.props.companyState.docList.documents) || [];
        const companyDocs = (this.props.documents.data && this.props.documents.data.documents) || [];
        const files = [...companyStateDocs, ...companyDocs]
        const documents = [...(files || [])].map(d => ({...d, date: new Date(d.date || d.createdAt) })).filter(d => d.type !== 'Directory');
        documents.sort((a, b) => b.date - a.date);

        return  <div className="table-responsive" onClick={() => this.props.toggle(!this.props.expanded)}>
                <div className="text-center"><em>Latest Documents:</em></div>
                <table className="table table-condensed" style={{marginBottom: 0}}>
                <tbody>
                { documents.filter(d => !d.deleted).slice(0, 15).map((d, i) => {
                    return <tr key={i}><td><span className={documentTypeClasses(d)}/> </td>
                    <td><Link activeClassName="active" className="nav-link" to={`${this.props.baseUrl}/documents/view/${d.id}`}>{ d.filename }</Link></td>
                    <td>{stringDateToFormattedString(d.date)}</td></tr>
                }) }
                </tbody>
                </table>
        </div>
    }

    render() {
        let bodyClass = "expandable ";
        if(this.props.expanded){
            bodyClass += "expanded ";
        }
        return <Widget className=" company-documents" iconClass="fa fa-files-o" title="File Cabinet" link={`${this.props.baseUrl}/documents`} bodyClass={bodyClass}>
            { this.renderBody() }
        </Widget>
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



const fileSource = {
  beginDrag(props) {
    return {
      id: props.item.id,
      directoryId: props.item.directoryId
    };
  }
};

const fileTarget = {
    drop(props, monitor) {
        const newDirectoryId = props.item.id === 'root' ? null : props.item.id;
        const dragItem = monitor.getItem()
        if(!dragItem.id && dragItem.files){
            if(!monitor.didDrop()) {
                props.showSubTree(newDirectoryId);
                props.path.map(id =>  props.showSubTree(id))
                props.upload(dragItem.files, newDirectoryId);
                return;
            }
        }
        if(newDirectoryId === dragItem.id){
            return;
        }
        if(dragItem.directoryId === newDirectoryId){
            return;
        };
        if(props.path.indexOf(dragItem.id) > -1){
            return;
        }
        if(!monitor.didDrop()){
            props.showSubTree(newDirectoryId);
            props.path.map(id =>  props.showSubTree(id))
            props.move(dragItem.id, newDirectoryId);
            // always show parents on drop, so we can select result when upload finished
        }
    },
    canDrop(props, monitor) {
        return props.canUpdate && props.item.id === "root" || props.item.userUploaded;
    }


}

const GC_FILE = 'GC_FILE';

@DropTarget((props) => props.accepts, fileTarget, (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
  canDrop: monitor.canDrop()
}))
@DragSource(GC_FILE, fileSource, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging()
}))
class RenderFile extends React.Component {
    render() {
        const props = this.props;
        const { item, link, push, renameFile, deleteFile, startRename, endRename, createDirectory, startCreateFolder, endCreateFolder } = props;
        const { isDragging, connectDragSource, connectDropTarget, isOver, canDrop } = props;
        const showingSubTree =  props.showingSubTree || (canDrop && isOver);

        if(item.deleted){
            return false;
        }

        const defaultView = () => {
            return  <span>{ item.type !== 'Directory' && <span onClick={() => push(link)} className="view">View</span> }
                    { this.props.canUpdate && item.userUploaded && <span onClick={() => startRename(item.id)} className="view">Rename</span> }
                    { this.props.canUpdate && item.userUploaded && <span onClick={() => deleteFile(item.id)} className="view">Delete</span> }</span>
        }

        const submitRename = () => {
            const value = this.refs.input.getValue();
            if(value){
                renameFile(item.id, value);
                endRename();
            }
        }

        const submitCreateFolder = () => {
            const value = this.refs.input.getValue();
            if(value){
                createDirectory(item.id === 'root' ? null : item.id, value);
                endCreateFolder();
            }
        }

        const showNew = () => {
            return <div className="file-sub-tree"><span className="expand-control"></span>
                    <span className="file" onClick={ startCreateFolder}>
                        <span className="icon fa fa-plus-circle"></span>
                        <span className="filename"><em>Create New Folder</em></span>
                    </span>
                </div>
        }

        const showNewForm = () => {
            // is.props.createDirectory(item.id === 'root' ? null : item.id, 'New Folder')
            return <div className="file-sub-tree"><span className="expand-control"></span>
                    <span className="file selected" >
                        <span className="icon fa fa-plus-circle"></span>
                        <Input type="text" placeholder={ 'New Folder' } ref="input" />
                        <span onClick={submitCreateFolder} className="view">Create Folder</span>
                        <span onClick={endCreateFolder} className="view">Cancel</span>
                    </span>
                </div>
        }

        const fileSpan = <span className={classnames('file', {selected: props.selected, 'can-drop': canDrop && isOver})} onMouseDown={() => !props.selected && props.select()}>
                <span className={'icon ' + documentTypeClasses(item, showingSubTree)} />
                { !this.props.renaming && <span className="filename">{ item.filename }</span> }
                { !this.props.renaming && defaultView() }
                { this.props.renaming && <Input type="text" defaultValue={ item.filename } ref="input"/> }
                { this.props.renaming && <span onClick={() => submitRename()} className="view">Save</span> }
                { this.props.renaming && <span onClick={() => endRename()} className="view">Cancel</span> }
                </span>

        const canCreateDirectory = this.props.canUpdate && (item.id === "root" || item.userUploaded);
        const renderedFile = (<div className="file-sub-tree">
              <span className="expand-control">
                { item.type === 'Directory'  && showingSubTree && <span className="fa fa-minus-square-o" onClick={() => props.hideSubTree()} /> }
                { item.type === 'Directory'  && !showingSubTree && <span className="fa fa-plus-square-o" onClick={() => props.showSubTree()} /> }
              </span>
                { item.id !== "root" && item.userUploaded && !this.props.renaming ? connectDragSource(fileSpan) : fileSpan }
                { item.type === 'Directory' &&
                    <div className={classnames("children", {"showing": showingSubTree})}>
                    { canCreateDirectory && !this.props.creatingFolder && showNew() }
                    { canCreateDirectory && this.props.creatingFolder && showNewForm() }
                    { props.children }
                    </div>
                }
            </div>)
        return connectDropTarget(renderedFile);
    }
}

function filterTree(value, tree) {
    if(!value){
        return tree;
    }
    function filter(value, tree){
        return (tree || []).map(node => {
            const children = filter(value, node.children);
            const newNode = {...node, children};
            let found = !!children.length;
            if(node.filename.toLocaleLowerCase().indexOf(value) > -1){
                found = true;
            }
            return found && newNode;
        }).filter(f => f)
    }
    const newTree = filter(value, tree);
    return newTree;
}


class FileTree extends React.Component {

    constructor(){
        super();
        this.expandAll = ::this.expandAll;
        this.collapseAll = ::this.collapseAll;
        this.onSearchChange = ::this.onSearchChange;
        this.upload = ::this.upload;
        this.move = ::this.move;
        this.renameFile = ::this.renameFile;
        this.deleteFile = :: this.deleteFile;
        this.createDirectory = :: this.createDirectory;
        this.state = {root: true};
    }

    select(id) {
        this.setState({selected: id, renaming: false, creatingFolder: false});
    }

    startRename(id) {
        this.setState({renaming: id, selected: id})
    }

    endRename(id) {
        this.setState({renaming: false});
    }

    startCreateFolder(id) {
        this.setState({creatingFolder: id, selected: false});
    }

    endCreateFolder() {
        this.setState({creatingFolder: false});
    }

    showSubTree(id) {
        this.setState({[id]: true});
    }

    hideSubTree(id) {
        this.setState({[id]: false});
    }

    expandAll() {
        this.setState(this.props.flatFiles.reduce((acc, f) => {
            acc[f.id] = true;
            return acc;
        }, {}))
    }

    collapseAll() {
        this.setState(this.props.flatFiles.reduce((acc, f) => {
            acc[f.id] = false;
            return acc;
        }, {}))
    }

    onSearchChange(event) {
        const value = event.target.value;
        this.setState({filter: value});
    }

    move(...args){
        this.props.move(...args)
    }

    renameFile(...args){
        this.props.renameFile(...args)
    }

    deleteFile(...args){
        this.props.deleteFile(...args)
    }

    createDirectory(...args){
        this.props.createDirectory(...args)
    }

    upload(files, directoryId) {
        if(!directoryId){
            const target = this.state.selected && this.props.flatFiles.find(f => f.id === this.state.selected);
            if(target && target.userUploaded){
                directoryId = target.type === 'Directory' ? target.id : target.directoryId;
                directoryId = directoryId === 'root' ? null : directoryId;
            }
        }
        directoryId && this.showSubTree(directoryId)
        this.props.upload(files, directoryId)
            .then((r) => {
                if(r && r.response && r.response.documentIds && r.response.documentIds[0]){
                    this.setState({selected: r.response.documentIds[0]});
                }
            })
    }

    render() {
        const loop = (data, path) => {
            return data.map((item) => {
                const link = this.props.companyId ? `/company/view/${this.props.companyId}/documents/view/${item.id}` : `/documents/view/${item.id}`;
                const props = {
                    key: item.id,
                    item: item,
                    link: link,
                    push: this.props.push,
                    accepts: item.type === 'Directory' ? [GC_FILE, NativeTypes.FILE] : [],
                    fileTypes:  GC_FILE,
                    select: () => this.select(item.id),
                    selected: !this.state.creatingFolder && this.state.selected === item.id,
                    renaming: !this.state.creatingFolder && this.state.selected === item.id && this.state.renaming === item.id,
                    showingSubTree: this.state[item.id] || !!this.state.filter,
                    showSubTree: (id) => this.showSubTree(id || item.id),
                    hideSubTree: (id) => this.hideSubTree(id || item.id),
                    move: this.move,
                    startRename: () => this.startRename(item.id),
                    endRename: () => this.endRename(),
                    renameFile: this.props.renameFile && this.renameFile,
                    deleteFile: this.props.deleteFile && this.deleteFile,
                    creatingFolder: this.state.creatingFolder === item.id,
                    startCreateFolder: () => this.startCreateFolder(item.id),
                    endCreateFolder: () => this.endCreateFolder(),
                    createDirectory: this.createDirectory,
                    upload: this.upload,
                    path: path,
                    canUpdate: this.props.canUpdate
                }
                if (item.children && item.children.length) {
                    const newPath = [...path, item.id];

                    item.children.sort(firstBy(doc => {
                        return doc.userUploaded ? 1 : 0
                    }).thenBy('filename').thenBy('id'))

                    return <RenderFile  {...props}>
                       { loop( item.children, newPath) }
                    </RenderFile>
                }

                return <RenderFile {...props} />;
            });
        };

        const files = filterTree(this.state.filter, this.props.files);
        return <div>
            <div className="button-row">
                <form className="form-inline">
                <Input type="text" label="Search" onChange={this.onSearchChange} value={this.state.filter}/>
                <div className="btn-group">
                <Button onClick={this.expandAll}>Expand All</Button>
                <Button onClick={this.collapseAll}>Collapse All</Button>
                </div>
            </form>
            </div>
            <div className="file-tree">
                { loop(files, []) }
            </div>
            { this.props.canUpdate && <DocumentsForm documents={{onChange: (files) => this.upload(files)}} /> }
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
        if(!d.directoryId || !map[d.directoryId]){
            roots.push(map[d.id]);
        }
        else{
            map[d.directoryId].children.push(map[d.id]);
        }
    });
    return [{
            id: 'root',
            type: 'Directory',
            filename: 'Files',
            children: roots
        }]
}

//(state, ownProps) => ({uploadedDocuments: state.resources[`/company/${ownProps.companyId}/documents`]}


@connect(undefined,
 (dispatch, ownProps) => ({
    //companyTransaction: (...args) => companyTransaction(...args),
    addNotification: (args) => dispatch(addNotification(args)),
    createDocument: (...args) => dispatch(createResource(`/company/${ownProps.companyId}/documents`, ...args)),
    updateDocument: (...args) => dispatch(updateResource(...args)),
    softDeleteResource: (...args) => dispatch(softDeleteResource(...args)),
}))
@DocumentsHOCFromRoute(true)
export class CompanyDocuments extends React.Component {

    static propTypes = {
        companyState: PropTypes.object,
        companyId: PropTypes.string
    };

    constructor(props) {
        super();
        this.move = ::this.move;
        this.renameFile = ::this.renameFile;
        this.deleteFile = ::this.deleteFile;
        this.createDirectory = ::this.createDirectory;
        this.upload = ::this.upload;
        this.state = {companyState: props.companyState, documents: props.documents};
    }

    componentWillReceiveProps(newProps) {
        if(newProps.companyState && newProps.companyState.docList){
            this.setState({companyState: newProps.companyState});
        }
        if(newProps.documents && newProps.documents._status === 'complete'){
            this.setState({documents: newProps.documents});
        }
    }

    renderField(key, value) {
        switch(key){
            case 'date':
            case 'createdAt':
                return stringDateToFormattedString(value);
            default:
                return value;
        }
    }

    upload(files, directoryId=null) {
        const body = new FormData();
        body.append('json', JSON.stringify({directoryId}));
        (files || []).map(d => {
            body.append('documents', d, d.name);
        });
        return this.props.createDocument(body, {stringify: false, 'loadingMessage': 'Uploading'})
            .then((result) => {
                this.props.addNotification({message: 'File uploaded'});
                return result;
            })
            .catch((e) => this.props.addNotification({message: e.message, error: true}))
    }

    move(documentId, directoryId) {
        return this.props.updateDocument(`/company/${this.props.companyId}/document/${documentId}`, {directoryId: directoryId}, {loadingMessage: 'Moving File'})
            .then(() => this.props.addNotification({message: 'File moved'}))
            .catch((e) => this.props.addNotification({message: e.message, error: true}))
    }

    deleteFile(documentId) {
        return this.props.softDeleteResource(`/company/${this.props.companyId}/document/${documentId}`, {loadingMessage: 'Deleting File'})
            .then(() => this.props.addNotification({message: 'File deleted'}))
            .catch((e) => this.props.addNotification({message: e.message, error: true}))
    }

    renameFile(documentId, filename) {
        return this.props.updateDocument(`/company/${this.props.companyId}/document/${documentId}`, {filename: filename}, {loadingMessage: 'Renaming File'})
            .then(() => this.props.addNotification({message: 'File renamed'}))
            .catch((e) => this.props.addNotification({message: e.message, error: true}))
    }

    createDirectory(directoryId, name) {
        return this.props.createDocument({directoryId: directoryId, newDirectory: name})
            .then(() => {
                this.props.addNotification({message: 'Directory Created'})
            })
            .catch((e) => this.props.addNotification({message: e.message, error: true}))
    }

    renderTree() {
        const companyStateDocs = (this.state.companyState.docList && this.state.companyState.docList.documents) || [];
        const companyDocs = (this.state.documents.data && this.state.documents.data.documents) || [];
        const files = [...companyStateDocs, ...companyDocs]
        return  <div>
            <FileTree
                files={listToTree(files)}
                flatFiles={files}
                push={this.props.push}
                move={this.move}
                deleteFile={this.props.canUpdate && this.deleteFile}
                renameFile={this.props.canUpdate && this.renameFile}
                createDirectory={this.createDirectory}
                upload={this.upload}
                companyId={this.props.companyId}
                canUpdate={this.props.canUpdate}
                />
            { !files.length && <Loading/> }
        </div>
    }

    render() {
        return <LawBrowserContainer lawLinks={documentLawLinks()}>
                <Widget iconClass="fa fa-files-o" title="File Cabinet" bodyClass="documents">
                    { this.renderTree() }
                </Widget>
            </LawBrowserContainer>
    }
}


