"use strict";
import React, {PropTypes} from 'react';
import DropZone from 'react-dropzone';
import StaticField from './staticField';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';

export class Documents extends React.Component {
    static propTypes = {
        documents: PropTypes.object.isRequired,
    };

    handleDrop(e, files){
        e.preventDefault();
        e.stopPropagation();
        this.props.documents.onChange(files)
    }

    render() {
        const documents = this.props.documents;
        return <div><DropZone className="dropzone" { ...documents } rejectClassName={'reject'} activeClassName={'accept'} disablePreview={true}
                  onDrop={ ( filesToUpload, e ) => this.handleDrop(e, filesToUpload) }>
                  <div>Try dropping some files here, or click to select files to upload.</div>
            </DropZone>
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