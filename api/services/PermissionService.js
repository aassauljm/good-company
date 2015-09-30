// api/services/PermissionService.js

var _ = require('lodash');
var _super = require('sails-permissions/api/services/PermissionService');
var Promise = require('bluebird')

function PermissionService () { }

PermissionService.prototype = Object.create(_super);
_.extend(PermissionService.prototype, {

  // Extend with custom logic here by adding additional fields and methods,
  // and/or overriding methods in the superclass.
grantIfNeeded: function(permissions) {
    if (!_.isArray(permissions)) {
      permissions = [permissions];
    }

    // look up the models based on name, and replace them with ids
    var ok = Promise.map(permissions, function(permission) {
      var findRole = permission.role ? Role.findOne({
        name: permission.role
      }) : null;
      var findUser = permission.user ? User.findOne({
        username: permission.user
      }) : null;
      return Promise.all([findRole, findUser, Model.findOne({
          name: permission.model
        })])
        .spread(function(role, user, model) {
          permission.model = model.id;
          if (role && role.id) {
            permission.role = role.id;
          } else if (user && user.id) {
            permission.user = user.id;
          } else {
            return Promise.reject(new Error('no role or user specified'));
          }
        });
    });

    ok = ok.then(function() {
      return Promise.map(permissions, function(p){ return Permission.findOrCreate(p, p) });
    });

    return ok;
  }
});


module.exports = new PermissionService();
