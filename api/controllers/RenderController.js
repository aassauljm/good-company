"use strict";

import pdf from 'html-pdf';
import fetch from "isomorphic-fetch";
import FormData from 'form-data';
const actionUtil = require('sails-hook-sequelize-blueprints/actionUtil');

function binaryParser(res, callback) {
    res.setEncoding('binary');
    res.data = '';
    res.on('data', function (chunk) {
        res.data += chunk;
    });
    res.on('end', function () {
        callback(null, new Buffer(res.data, 'binary'));
    });
}

module.exports = {

    renderShareRegister: function(req, res){
        const state = {login: {loggedIn: req.isAuthenticated()}, userInfo: req.user.toJSON(), _status: 'complete'};
        RenderService.serverRender('/company/render/'+req.params.id+'/shareregister', req.get('cookie'), state)
            .then(result => {
                res.render('staticContent', {reactOutput: result.reactOutput, assets: sails.config.paths.public}, (err, html) => {
                    const options = { format: 'A4',"border": "2cm", "orientation": "portrait", "base": 'file://'+sails.config.paths.public, phantomPath: '/usr/local/bin/phantomjs'};
                    pdf.create(html, options).toStream(function(err, stream){
                        if(err){
                            return res.negotiate(err);
                        }
                        res.setHeader('Content-disposition', `attachment; filename=Share Register.pdf`);
                        stream.pipe(res);
                    });
                });
            })
            .catch(res.negotiate)
    },

    renderTemplate: function(req, res){
        let response;
        fetch(sails.config.renderServiceUrl, {
              method: 'POST',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        })
        .then((_response) => {
            response = _response;

            res.set('Content-Type', response.headers.get('Content-Type'));
            res.set('Content-Disposition', response.headers.get('Content-Disposition'));
            response.body
              .on('data', function (chunk) {
                res.write(chunk);
              })
              .on('end', function () {
                res.end();
              });


        })
        .catch(e => {
            res.serverError(e);
        })
    },

    sendTemplate: function(req, res) {
        fetch(sails.config.renderServiceUrl, {
              method: 'POST',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body.renderData)
        })
        .then(fileResponse => fileResponse.buffer())
        .then(buff => {
            return MailService.sendTemplate(req.body.recipients, buff, req.body.renderData.filename)
                .then(() => {
                    res.ok({message: ['Template sent']});
                });
        })
        .catch(error => {
            res.serverError(error);
        });
    },


    echo: function(req, res) {
        const args = actionUtil.parseValues(req)
        res.attachment(args.filename)
        res.write(args.file);
        res.end();
    }

    /*renderTemplate: proxy(sails.config.renderServiceUrl, {
        forwardPath: function(req, res) {
            return '/render';
        }
    })*/
};
