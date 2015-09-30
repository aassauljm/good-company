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
       // PermissionService.grantIfNeeded({role: 'collaborator', model: 'Issue', action: 'update',
        //                 criteria: { where: { public: true }, blacklist: ['public'] } })
  ])
  .spread(function(role){
  })
};
