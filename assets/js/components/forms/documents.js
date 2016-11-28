"use strict";
import React, {PropTypes} from 'react';
import StaticField from './staticField';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { NativeTypes } from 'react-dnd-html5-backend';
import { DropTarget } from 'react-dnd';

const fileTarget = {
    drop(props, monitor) {
        if(props.documents.value){
            props.documents.onChange([...props.documents.value, ...monitor.getItem().files]);
        }
        else{
            props.documents.onChange(monitor.getItem().files);
        }
    }
};

class DocumentBase extends React.Component {
    static propTypes = {
        documents: PropTypes.object.isRequired,
    };

    open() {
        this.isFileDialogActive = true;
        this.fileInputEl.value = null;
        this.fileInputEl.click();
    }

    onDrop(e) {
        const droppedFiles = e.dataTransfer ? e.dataTransfer.files : e.target.files;
        this.props.documents.onChange([...(this.props.documents.value || []), ...droppedFiles]);
    }

    onFileDialogCancel() {
        // timeout will not recognize context of this method
        const { onFileDialogCancel } = this.props;
        const { fileInputEl } = this;
        let { isFileDialogActive } = this;
        // execute the timeout only if the onFileDialogCancel is defined and FileDialog
        // is opened in the browser
        if (onFileDialogCancel && isFileDialogActive) {
          setTimeout(() => {
            // Returns an object as FileList
            const FileList = fileInputEl.files;
            if (!FileList.length) {
              isFileDialogActive = false;
              onFileDialogCancel();
            }
          }, 300);
        }
    }



    render() {
        const documents = this.props.documents;
        const { connectDropTarget, isOver, canDrop } = this.props;
        let className="dropzone";
        if(isOver && !canDrop){
            className += ' reject';
        }
        else if(isOver && canDrop){
            className += ' accept';
        }
        const inputAttributes = {
            type: 'file',
            style: { display: 'none' },
            multiple: true,
            ref: el => this.fileInputEl = el,
            onChange: (e) => this.onDrop(e)
        };

        return <div>
            { this.props.label && <label className="control-label">{ this.props.label }</label>}

                { connectDropTarget(<div className="dropzone" onClick={() => this.open()}>
                                        <div>Drop files here to upload or <span className="vanity-link">click to browse</span> your device</div>
                  <input {...inputAttributes} />
            </div>) }
           {((documents|| {}).value || []).map((file, i) => {
                return  <StaticField type="static" key={i} label="File" key={i}
                hasFeedback groupClassName='has-group' value={file.name}
                buttonAfter={<button className="btn btn-default" onClick={() => {
                    const clone = documents.value.slice();
                    clone.splice(i, 1);
                    documents.onChange(clone);
                }}><Glyphicon glyph='trash'/></button>} />

            }) }
           </div>
        }
}


export const Documents = DropTarget(NativeTypes.FILE, fileTarget, (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
  canDrop: monitor.canDrop()
}))(DocumentBase);