var Promise = require('bluebird');
/**
function grantAdminPermissions (roles, models, admin) {
  var adminRole = _.find(roles, { name: 'admin' });
  var permissions = _.flatten(_.map(models, function (modelEntity) {
    var model = sails.models[modelEntity.identity];

    return _.map(grants.admin, function (permission) {
      var newPermission = {
        model: modelEntity.id,
        action: permission.action,
        role: adminRole.id,
      };
      return Permission.findOrCreate(newPermission, newPermission);
    });
  }));

  return Promise.all(permissions);
}
 */

const rules = {
    "admin": {

    }
}


exports.create = function () {
  return Promise.all([
        PermissionService.grantIfNeeded({ role: 'admin', model: 'role', action: 'read'}),
        PermissionService.grantIfNeeded({ role: 'registered', model: 'user', action: 'update', relation:'owner'}),
       // PermissionService.grantIfNeeded({role: 'collaborator', model: 'Issue', action: 'update',
        //                 criteria: { where: { public: true }, blacklist: ['public'] } })

        PermissionService.grantIfNeeded({action: 'create', model: 'document', role: 'registered'}),
        PermissionService.grantIfNeeded({action: 'read', model: 'document', role: 'registered', relation:'owner'}),
        PermissionService.grantIfNeeded({action: 'update', model: 'document', role: 'registered', relation:'owner'}),
        PermissionService.grantIfNeeded({action: 'delete', model: 'document', role: 'registered', relation:'owner'})
  ])
  .spread(function(roles){
        sails.log.verbose(arguments)
        sails.log.verbose('Permissions Added')
  })
};
