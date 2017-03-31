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

function changePermissions(changeFunction, req, res){
    const data = actionUtil.parseValues(req);
    return sequelize.query(`SELECT user_is_organisation_admin_of_catalex_user(:userId, :catalexId)`,
            { type: sequelize.QueryTypes.SELECT,
               replacements: { userId: req.user.id, catalexId: data.catalexId }})
        .then((r) => r[0].user_is_organisation_admin_of_catalex_user)
        .then(allowed => {
            if(!allowed){
                throw Exception();
            }
            return Promise.map(data.permissions, permission => {
                if(['create'].indexOf(permission) === -1){
                    throw Exception();
                }
                if(['Company'].indexOf(data.model) === -1){
                    throw Exception();
                }
                return changeFunction(data.catalexId, data.model, permission, data.allow)
            })
        })
        .then(r => res.json({message: 'Permissions Updated'}))
        .catch(function(err){
            return res.forbidden();
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

        const catalexId = sequelize.query(`SELECT identifier
            FROM passport
            WHERE "userId" = :id AND provider = 'catalex'`,
                { type: sequelize.QueryTypes.SELECT,
                   replacements: { id: req.user.id }});

        const permissions = User.permissions(req.user.id);

        Promise.join(User.userWithRoles(req.user.id), last, connectedApiServices, User.getOrganisationInfo(req.user.id), catalexId, permissions)
            .spread(function(r, last, connectedApiServices, organisation, catalex, permissions) {
                const ago = last[0].last_login ? moment(last[0].last_login).fromNow() : "first log in";
                res.json({...r.toJSON(), lastLogin: ago, mbieServices: connectedApiServices.map(r => r.service), organisation, catalexId: catalex.map(c => c.identifier)[0], permissions });
            });
    },

    recentActivity: function(req, res) {
        ActivityLog.query(req.user.id, null, 10)
        .then(activities => res.json(activities));
    },

    recentActivityFull: function(req, res) {
        ActivityLog.query(req.user.id)
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
    },

    addPermissions: function(req, res) {
        return changePermissions(PermissionService.addPermissionCatalexUser, req, res);
    },

    removePermissions: function(req, res) {
        return changePermissions(PermissionService.removePermissionCatalexUser, req, res);
    }

}
