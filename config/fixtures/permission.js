var Promise = require('bluebird');

var grants = {
  admin: [
    { action: 'create' },
    { action: 'read' },
    { action: 'update' },
    { action: 'delete' }
  ],
  registered: [
    { action: 'create' },
    { action: 'read' }
  ],
  public: [
    { action: 'read' }
  ]
};

var modelRestrictions = {
  registered: [
    'Role',
    'Permission',
    'User',
    'Passport'
  ],
  public: [
    'Role',
    'Permission',
    'User',
    'Model',
    'Passport'
  ]
};

// TODO let users override this in the actual model definition

/**
 * Create default Role permissions
 */
exports.create = function (roles, models, admin) {
  return Promise.all([
    grantAdminPermissions(roles, models, admin),
    grantRegisteredPermissions(roles, models, admin)
  ])
  .spread(function (err, permissions) {
    sails.log.verbose('created', permissions.length, 'permissions');
    return permissions;
  })
};

function grantAdminPermissions (roles, models, admin) {
  var adminRole = _.find(roles, { name: 'admin' });
  var permissions = _.flatten(_.map(models, function (modelEntity) {
    var model = sails.models[modelEntity.identity];

    return _.map(grants.admin, function (permission) {
      var newPermission = {
        model_id: modelEntity.id,
        action: permission.action,
        role_id: adminRole.id,
      };
      return Permission.findOrCreate({where: newPermission, defaults: newPermission});
    });
  }))
}

function grantRegisteredPermissions (roles, models, admin) {
  var registeredRole = _.find(roles, { name: 'registered' });
  var permissions = [
    {
      model_id: _.find(models, { name: 'Permission' }).id,
      action: 'read',
      role_id: registeredRole.id
    },
    {
      model_id: _.find(models, { name: 'Model' }).id,
      action: 'read',
      role_id: registeredRole.id
    },
    {
      model_id: _.find(models, { name: 'User' }).id,
      action: 'update',
      role_id: registeredRole.id,
      relation: 'owner'
    },
    {
      model_id: _.find(models, { name: 'User' }).id,
      action: 'read',
      role_id: registeredRole.id,
      relation: 'owner'
    },
    {
      model_id: _.find(models, { name: 'Document' }).id,
      action: 'create',
      role_id: registeredRole.id,
    },
    {
      model_id: _.find(models, { name: 'Document' }).id,
      action: 'read',
      role_id: registeredRole.id,
      relation: 'owner'
    }
  ];

  return Promise.all(
    _.map(permissions, function (permission) {
      return Permission.findOrCreate({where: permission, defaults:permission});
    })
  )
}
