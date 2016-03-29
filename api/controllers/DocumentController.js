/**
 * DocumentController
 *
 * @description :: Server-side logic for managing documents
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var tmp = Promise.promisifyAll(require("temp"));
var PDFImage = require("pdf-image").PDFImage;
var webshot = require('webshot');
var toArray = require('stream-to-array')


function readBinary(fd){
    return fs.readFileAsync(fd)
    .then(function(file){
        return file;
    })
}


function makePreview(fd, type){
    var pdfImage = new PDFImage(fd, {convertOptions: {'-resize': '256x'}});
    return pdfImage.convertPage(0)
        .then(function(fd){
            return readBinary(fd);
        });
}

function renderAndSaveWebPreview(doc){
    return toArray(webshot(doc.sourceUrl, {shotSize: {height: 'all'}}))
    .then(function(parts){
        var buffers = []
        for (var i = 0, l = parts.length; i < l ; ++i) {
          var part = parts[i]
          buffers.push((part instanceof Buffer) ? part : new Buffer(part))
        }
        return Buffer.concat(buffers)
    })
    .then(function(data){
        return DocumentData.create({data: data})
    })
    .then(function(docData){
        doc.documentPreview = docData;
        return doc.setDocumentPreview(docData);
    })
}

function renderAndSavePreview(doc){
    let tmpFile;
    return tmp.openAsync('preview')
    .then(_tmpFile => {
        tmpFile = _tmpFile;
        return doc.getDocumentData()
    })
    .then((docData) => {
        console.log('write',tmpFile.fd)

        return fs.write(tmpFile.fd, docData.data);
    })
    .then(() => {
         console.log('close')
        return fs.closeAsync(tmpFile.fd);
    })
    .then(() => {
        console.log('pre')
        return makePreview(tmpFile.path)
    })
    .then(function(data){
        return DocumentData.create({data: data})
    })
    .then(function(docData){
        doc.documentPreview = docData;
        return doc.setDocumentPreview(docData);
    })
    .then(() => {
        return tmpFile.cleanup();
    })
}

module.exports = {
    uploadDocument: function(req, res) {
        req.file('document').upload({
            // don't allow the total upload size to exceed ~20MB
            maxBytes: 20000000
        }, function whenDone(err, uploadedFiles) {
            if (err) {
                return res.negotiate(err);
            }

            // If no files were uploaded, respond with an error.
            if (uploadedFiles.length === 0) {
                return res.badRequest('No file was uploaded');
            }

            var type = uploadedFiles[0].filename.split('.').pop();
            Promise.join(readBinary(uploadedFiles[0].fd),
                        makePreview(uploadedFiles[0].fd, type))
                .spread(function(file, preview){
                    sails.log.debug('Uploaded, saving to db');
                    return Document.create({
                        filename: uploadedFiles[0].filename,
                        createdById: req.user.id,
                        ownerId: req.user.id,
                        type: type,
                        documentData: {
                             data: file,
                        },
                        documentPreview: {
                            data: preview
                        }
                    }, {include: [
                        {model: DocumentData, as: 'documentData'},
                        {model: DocumentData, as: 'documentPreview'}]});
                })
                .then(function(newInstance){
                    sails.log.debug('Saved to db');
                    res.created({id: newInstance.id });
                })

        });
    },
    getDocument: function(req, res){
        Document.findOne({where: {id: req.param('id')}, include: [{model: DocumentData, as: 'documentData'}]})
            .then(function(doc){
                if (!doc) return res.notFound();
                res.attachment(doc.filename)
                res.write(doc.documentData.data);
                res.end();
            })
            .catch(function(err){
               return res.negotiate(err);
            })
    },
    getDocumentPreview: function(req, res){
        Document.findOne({where: {id: req.param('id')}, include: [{model: DocumentData, as: 'documentPreview'}]})
            .then(function(doc){
                if (!doc) return res.notFound();
                if(!doc.documentPreview && doc.sourceUrl){
                    //generate preview
                    return renderAndSaveWebPreview(doc)
                }
                else if(!doc.documentPreview){
                    //generate preview
                    return renderAndSavePreview(doc)
                }
                return doc;
            })
            .then(function(doc){
                res.contentType('image/png');
                res.write(doc.documentPreview.data);
                res.end();
            })
            .catch(function(err){
               return res.negotiate(err);
            })
    }
};