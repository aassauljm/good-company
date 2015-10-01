/**
 * DocumentController
 *
 * @description :: Server-side logic for managing documents
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));

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
            fs.readFileAsync(uploadedFiles[0].fd, 'binary')
                .then(function(file){
                    let doc;
                    return Document.create({
                        filename: uploadedFiles[0].filename,
                        createdBy: req.user.id,
                        documentData: {
                             data: file,
                        }
                    })
                })
                .then(function(newInstance){
                    // If we have the pubsub hook, use the model class's publish method
                    // to notify all subscribers about the created item
                    if (req._sails.hooks.pubsub) {
                        if (req.isSocket) {
                            Document.subscribe(req, newInstance);
                            Document.introduce(newInstance);
                        }
                        Document.publishCreate(newInstance.toJSON(), !req.options.mirror && req);
                    }

                    res.created(newInstance);
                })
        });
    },
    getDocument: function(req, res){
        Document.findOne(req.param('id'))
            .populate('documentData')
            .then(function(doc){
                if (!doc) return res.notFound();
                res.attachment(doc.filename)
                res.write(new Buffer(doc.documentData.data));
                res.end();
            })
            .catch(function(err){
               return res.negotiate(err);
            })

    }
};