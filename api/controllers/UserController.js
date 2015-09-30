// api/controllers/UserController.js

var _ = require('lodash');
var _super = require('sails-permissions/api/controllers/UserController');
var Promise = require("bluebird");
var bcrypt = Promise.promisifyAll(require('bcrypt'));
var actionUtil = require('sails/lib/hooks/blueprints/actionUtil');

_.merge(exports, _super);
_.merge(exports, {

  // Extend with custom logic here by adding additional fields, methods, etc.

    userInfo: function(req, res){
        User.findOne({id: req.user.id})
        .populate('roles')
        .then(function(r){
            res.json(r);
        })
    },

    setPassword: function(req, res) {
        sails.models.passport.findOne({
              protocol : 'local'
            , user     : req.user.id
            })
            .then(function(passport){
                return bcrypt.compareAsync(req.allParams().oldPassword||'', passport.password)
                    .then(function(match){
                        if(!match){
                            throw new sails.config.exceptions.ForbiddenException('Incorrect Password');
                        }
                        return passport.changePassword(req.allParams().newPassword)
                    });
            })
            .then(function(match){
                res.ok();
            })
            .catch(sails.config.exceptions.ForbiddenException, function(err){
                res.forbidden({'oldPassword': [err]});
            })
            .catch(sails.config.exceptions.ValidationException, function(err){
                res.badRequest({'newPassword': [err]});
            })
    },
    signup: function(req, res) {
        var data = actionUtil.parseValues(req);
        User.create(data).exec(function created (err, newInstance) {

        // Differentiate between waterline-originated validation errors
        // and serious underlying issues. Respond with badRequest if a
        // validation error is encountered, w/ validation info.
        if (err) return res.negotiate(err);

        // If we have the pubsub hook, use the model class's publish method
        // to notify all subscribers about the created item
        if (req._sails.hooks.pubsub) {
            if (req.isSocket) {
                Model.subscribe(req, newInstance);
                Model.introduce(newInstance);
            }
            Model.publishCreate(newInstance, !req.options.mirror && req);
        }
        // Sign in

        // Send JSONP-friendly response if it's supported
          var passport = sails.services.passport;

          // Initialize Passport
          passport.initialize()(req, res, function () {
            // Use the built-in sessions
                passport.session()(req, res, function () {
                    req.login(user, function(err) {
                      if (err) { return next(err); }
                      req.session.authenticated = true;
                      return res.ok({account_created: true});
                    });
                });
        });
      });

    }
});
