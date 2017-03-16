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
                    email: {
                        $iLike:data.email
                    },
                    username: {
                        $iLike: data.username
                    }
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

        const connectedApiServices = sequelize.query(`select service from api_credential where "ownerId" = :id and  now() < "createdAt" + ( "expiresIn" * interval '1 second') group by service`,
                                                { type: sequelize.QueryTypes.SELECT,
                                                  replacements: { id: req.user.id }});

        Promise.join(User.userWithRoles(req.user.id), last, connectedApiServices, User.getOrganisationInfo(req.user.id))
            .spread(function(r, last, connectedApiServices) {
                const ago = last[0].last_login ? moment(last[0].last_login).fromNow() : "first log in";
                res.json({...r.toJSON(), lastLogin: ago, mbieServices: connectedApiServices.map(r => r.service)});
            });
    },

    recentActivity: function(req, res) {
        ActivityLog.findAll({
            where: {userId: req.user.id},
            order: [['createdAt', 'DESC']],
            limit: 10
        })
        .then(activities => res.json(activities));
    },

    recentActivityFull: function(req, res) {
        ActivityLog.findAll({
            where: {userId: req.user.id},
            order: [['createdAt', 'DESC']]
        })
        .then(activities => res.json(activities));
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
   /* signup: function(req, res) {
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
                            return ActivityLog.create({
                                type: ActivityLog.types.ACCOUNT_CREATED,
                                userId: req.user.id,
                                description: 'Created account'
                            })
                            .then(() => res.ok({
                                account_created: true
                            }))
                            .then(() => {
                                MailService.signup(user)
                            })
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
    }, */

    pendingJobs: function(req, res) {
        // should be using this, but it shows removed jobs
        QueueService.searchJobs(req.user.id)
            .then(results => {
                return res.json({pending: results.filter(r => r.state !== 'failed')});
            })
            .catch(e => {
                res.json({pending:[]});
                sails.log.error(e);
            });
    },

    alerts: function(req, res) {
         sequelize.query("select all_company_notifications(:id) as result",
                   { type: sequelize.QueryTypes.SELECT,
                    replacements: { id: req.user.id }})
         .then(results => {
            return res.json(results[0].result)
         })
    },

    accountSettings: function(req, res) {
        var data = actionUtil.parseValues(req).settings;
        return req.user.update({settings: {...(req.user.settings || {}), ...data}})
            .then(() => {
                res.json({message: 'Account Updated'});
            })
            .catch(function(err){
                return res.serverError(err);
            });
    }
}
