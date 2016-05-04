// api/controllers/UserController.js

var _ = require('lodash');
var Promise = require("bluebird");
var bcrypt = Promise.promisifyAll(require('bcrypt'));
var actionUtil = require('sails/lib/hooks/blueprints/actionUtil');
var moment = require('moment');

function checkNameCollision(data) {
    return User.findAll({
            where: {
                $or: {
                    email: data.email,
                    username: data.username
                }
            }
        })
        .then(function(results) {
            if (results.length) {
                throw new sails.config.exceptions.ValidationException('A User with that name or email number already exists');
            }
        })
}

module.exports = {

    userInfo: function(req, res) {
        const last = sequelize.query("select last_login(:id)",
                               { type: sequelize.QueryTypes.SELECT,
                                replacements: { id: req.user.id }});
        Promise.join(User.userWithRoles(req.user.id), last)
            .spread(function(r, last) {
                const ago = last[0].last_login ? moment(last[0].last_login).fromNow() : "first log in";
                res.json({...r.toJSON(), lastLogin: ago});
            });
    },

    recentActivity: function(req, res) {
        User.recentActivity(rq.user.id)
            .then(function(activity){
                res.json(activity)
            })
            .catch(function(err){
                res.badRequest(err);
            })
    },

    setPassword: function(req, res) {
        sails.models.passport.findOne({where: {
                protocol: 'local',
                userId: req.user.id
            }})
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
                res.ok({message: ['Password set.']});
            })
            .then(() => {
                return ActivityLog.create({
                    type: ActivityLog.types.SET_PASSWORD,
                    user: req.user,
                    description: `Updated Password`,
                    data: {companyId: company.id}
                });
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
    validateUser: function(req, res){
        var data = actionUtil.parseValues(req);
        checkNameCollision(data)
            .then(function(){
                res.ok({})
            })
            .catch(function(err){
                res.badRequest(err);
            })
    },
    signup: function(req, res) {
        Promise.resolve()
            .then(() => sails.services.passport.protocols.local.register(req.body))
            .then(function(user) {
                const passport = sails.services.passport;
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
            .catch(sails.config.exceptions.ValidationError, function(err){
                return res.badRequest(err);
            })
            .catch(function(err){
                return res.serverError(err);
            });

    }
}