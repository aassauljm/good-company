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
            // TODO, validate matter
            fs.readFileAsync(uploadedFiles[0].fd, 'binary')
                .then(function(file){
                    Document.create({
                        matter: req.allParams().matter,
                        name: uploadedFiles[0].filename,
                        data: file,
                        uploader: req.user.id,
                        pending: req.user.accountType === 'client'
                    })
                    .exec(function(err, newInstance) {
                        if (err) return res.negotiate(err);

                        // If we have the pubsub hook, use the model class's publish method
                        // to notify all subscribers about the created item
                        if (req._sails.hooks.pubsub) {
                            if (req.isSocket) {
                                Document.subscribe(req, newInstance);
                                Document.introduce(newInstance);
                            }
                            Document.publishCreate(newInstance.toJSON(), !req.options.mirror && req);
                        }

                        // Send JSONP-friendly response if it's supported
                        res.created(newInstance);
                    });
            })
        });
    },
    getDocument: function(req, res){
        req.validate({
            id: 'string'
        });
        Document.findOne(req.param('id'))
            .then(function(doc){
                if (!doc) return res.notFound();
                res.attachment(doc.name)
                res.write(new Buffer(doc.data));
                res.end();
            })
            .catch(function(err){
               return res.negotiate(err);
            })

    }
};