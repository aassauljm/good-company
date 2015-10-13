// api/controllers/UserController.js

var _ = require('lodash');
var _super = require('sails-permissions/api/controllers/UserController');
var Promise = require("bluebird");
var bcrypt = Promise.promisifyAll(require('bcrypt'));
var actionUtil = require('sails/lib/hooks/blueprints/actionUtil');

_.merge(exports, _super);
_.merge(exports, {
    autoCreateBy: true,
    // Extend with custom logic here by adding additional fields, methods, etc.

    userInfo: function(req, res) {
        User.findOne({
                where: {
                    id: req.user.id
                },
                include: [{model: Role, as: 'roles'}]
            })
            .then(function(r) {
                res.json(r);
            })
    },

    setPassword: function(req, res) {
        sails.models.passport.findOne({
                protocol: 'local',
                user: req.user.id
            })
            .then(function(passport) {
                return bcrypt.compareAsync(req.allParams().oldPassword || '', passport.password)
                    .then(function(match) {
                        if (!match) {
                            throw new sails.config.exceptions.ForbiddenException('Incorrect Password');
                        }
                        return passport.changePassword(req.allParams().newPassword)
                    });
            })
            .then(function(match) {
                res.ok();
            })
            .catch(sails.config.exceptions.ForbiddenException, function(err) {
                res.forbidden({
                    'oldPassword': [err]
                });
            })
            .catch(sails.config.exceptions.ValidationException, function(err) {
                res.badRequest({
                    'newPassword': [err]
                });
            })
    },
    signup: function(req, res) {
        sails.services.passport.protocols.local.register(req.body)
            .then(function(user) {
                var passport = sails.services.passport;

                // Initialize Passport
                passport.initialize()(req, res, function() {
                    // Use the built-in sessions
                    passport.session()(req, res, function() {
                        req.login(user, function(err) {
                            if (err) {
                                return res.negotiate(err);
                            }
                            req.session.authenticated = true;
                            return res.ok({
                                account_created: true
                            });
                        });
                    });
                });
            })
            .catch(res.negotiate)
    }
});