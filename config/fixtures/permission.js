var Promise = require('bluebird');

var grants = {
    admin: [{
        action: 'create'
    }, {
        action: 'read'
    }, {
        action: 'update'
    }, {
        action: 'delete'
    }],
    registered: [{
        action: 'create'
    }, {
        action: 'read'
    }],
    public: [{
        action: 'read'
    }]
};
/*
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
*/
// TODO let users override this in the actual model definition

/**
 * Create default Role permissions
 */
exports.create = function(roles, models, admin) {
    sails.log.verbose('creating permissions');
    return Promise.all([
            grantAdminPermissions(roles, models, admin),
            grantRegisteredPermissions(roles, models, admin)
        ])
        .spread(function(err, permissions) {
            return permissions;
        })
};

function grantAdminPermissions(roles, models, admin) {
    var adminRole = _.find(roles, {
        name: 'admin'
    });
    var permissions = _.flatten(_.map(models, function(modelEntity) {
        var model = sails.models[modelEntity.identity];

        return _.map(grants.admin, function(permission) {
            var newPermission = {
                modelId: modelEntity.id,
                action: permission.action,
                roleId: adminRole.id,
            };
            return Permission.findOrCreate({
                where: newPermission,
                defaults: newPermission
            });
        });
    }))
}
// TODO, make json file of this
function grantRegisteredPermissions(roles, models, admin) {
    var registeredRole = _.find(roles, {
        name: 'registered'
    });
    var permissions = [{
        modelId: _.find(models, {
            name: 'Permission'
        }).id,
        action: 'read',
        roleId: registeredRole.id
    },{
        modelId: _.find(models, {
            name: 'User'
        }).id,
        action: 'update',
        roleId: registeredRole.id,
        relation: 'owner'
    }, {
        modelId: _.find(models, {
            name: 'User'
        }).id,
        action: 'read',
        roleId: registeredRole.id,
        relation: 'owner'
    }, {
        modelId: _.find(models, {
            name: 'Document'
        }).id,
        action: 'create',
        roleId: registeredRole.id,
    }, {
        modelId: _.find(models, {
            name: 'Document'
        }).id,
        action: 'read',
        roleId: registeredRole.id,
        relation: 'owner'
    }, {
        modelId: _.find(models, {
            name: 'Document'
        }).id,
        action: 'update',
        roleId: registeredRole.id,
        relation: 'owner'
    }, {
        modelId: _.find(models, {
            name: 'Document'
        }).id,
        action: 'delete',
        roleId: registeredRole.id,
        relation: 'owner'
    }, {
        modelId: _.find(models, {
            name: 'Company'
        }).id,
        action: 'create',
        roleId: registeredRole.id
    }, {
        modelId: _.find(models, {
            name: 'Company'
        }).id,
        action: 'read',
        roleId: registeredRole.id,
        relation: 'owner'
    }, {
        modelId: _.find(models, {
            name: 'Company'
        }).id,
        action: 'update',
        roleId: registeredRole.id,
        relation: 'owner'
    }, {
        modelId: _.find(models, {
            name: 'Company'
        }).id,
        action: 'delete',
        roleId: registeredRole.id,
        relation: 'owner'
    }, {
        modelId: _.find(models, {
            name: 'CompanyState'
        }).id,
        action: 'create',
        roleId: registeredRole.id
    }, {
        modelId: _.find(models, {
            name: 'Favourite'
        }).id,
        action: 'read',
        roleId: registeredRole.id,
        relation: 'owner'
    }, {
        modelId: _.find(models, {
            name: 'Favourite'
        }).id,
        action: 'create',
        roleId: registeredRole.id,
        relation: 'owner'
    }, {
        modelId: _.find(models, {
            name: 'Favourite'
        }).id,
        action: 'delete',
        roleId: registeredRole.id,
        relation: 'owner'
    }, {
        modelId: _.find(models, {
            name: 'Favourite'
        }).id,
        action: 'update',
        roleId: registeredRole.id,
        relation: 'owner'
    }];

    return Promise.all(
        _.map(permissions, function(permission) {
            return Permission.findOrCreate({
                where: permission,
                defaults: permission
            });
        })
    )
}