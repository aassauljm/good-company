// api/controllers/AuthController.js

const _ = require('lodash');
const _super = require('sails-auth/api/controllers/AuthController');
const actionUtil = require('sails-hook-sequelize-blueprints/actionUtil');
const fetch = require("isomorphic-fetch");
const querystring = require('querystring');
const passport = require('passport');


_.merge(exports, _super);
_.merge(exports, {

    // Extend with custom logic here by adding additional fields, methods, etc.
    logout: function(req, res) {
        req.logout();
        delete req.user;
        delete req.session.passport;
        // TESTING FOUND A PROBLEM WITH THIS NOT BEING SET
        req.session.authenticated = false;
        if(sails.config.USER_LOGOUT_URL){
            res.redirect(sails.config.USER_LOGOUT_URL)
        }

        else if (!req.isSocket) {
            res.redirect(req.query.next || '/');
        } else {
            res.ok();
        }
    },
    callback: function(req, res) {
        var action = req.param('action');

        function negotiateError(err) {
            if (action === 'register') {
                res.redirect('/register');
            } else if (action === 'login') {
                res.redirect('/login');
            } else if (action === 'disconnect') {
                res.redirect('back');
            } else {
                // make sure the server always returns a response to the client
                // i.e passport-local bad username/email or password
                res.send(403, err);
            }
        }

        sails.services.passport.callback(req, res, function(err, user) {
            if (err || !user) {
                sails.log.warn(user, err);
                return negotiateError(err);
            }

            req.login(user, function(err) {
                if (err) {
                    sails.log.warn(err);
                    return negotiateError(err);
                }

                req.session.authenticated = true;
                // Upon successful login, optionally redirect the user if there is a
                // `next` query param
                if (req.query.next) {
                    var url = sails.services.authservice.buildCallbackNextUrl(req);
                    res.status(302).set('Location', url);
                }
                sails.log.info('user', user.toJSON(), 'authenticated successfully');
                return res.redirect('/')
            });
        });
    },

});