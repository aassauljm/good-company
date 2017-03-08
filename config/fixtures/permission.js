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

var registered = {
    'Permission': [
        {
            action: 'read'
        }
    ],
    'User': [
        {
            action: 'read',
            relation: 'owner'
        },
        {
            action: 'update',
            relation: 'owner'
        },
    ],
    'Document': [
        {
            action: 'create'
        },
        {
            action: 'read',
            relation: 'owner'
        },
        {
            action: 'update',
            relation: 'owner'
        },
        {
            action: 'delete',
            relation: 'owner'
        }
    ],
    'Company': [
        {
            action: 'create'
        },
        {
            action: 'read',
            relation: 'owner'
        },
        {
            action: 'update',
            relation: 'owner'
        },
        {
            action: 'delete',
            relation: 'owner'
        }
    ],
    'Favourite': [
        {
            action: 'create'
        },
        {
            action: 'read',
            relation: 'user'
        },
        {
            action: 'update',
            relation: 'user'
        },
        {
            action: 'delete',
            relation: 'user'
        }
    ],
    'Event': [
        {
            action: 'create'
        },
        {
            action: 'read',
            relation: 'user'
        },
        {
            action: 'update',
            relation: 'user'
        },
        {
            action: 'delete',
            relation: 'user'
        }
    ],
    'CompanyState': [
        {
            action: 'create'
        }
    ],
    'ApiCredential': [
        {
            action: 'create'
        },
        {
            action: 'read',
            relation: 'owner'
        },
        {
            action: 'delete',
            relation: 'owner'
        }
    ]
};


function grantRegisteredPermissions(roles, models, admin) {
    var registeredRole = _.find(roles, {
        name: 'registered'
    });

    var permissions = Object.keys(registered).reduce((acc, modelKey) => {
        return registered[modelKey].reduce((acc, perm) => {
            acc.push({
                modelId: _.find(models, {
                    name: modelKey
                }).id,
                action: perm.action,
                roleId: registeredRole.id,
                relation: perm.relation
            })
            return acc;
        }, acc)
    }, [])

    return Promise.all(
        permissions.map(function(permission) {
            return Permission.findOrCreate({
                where: permission,
                defaults: permission
            });
        })
    )

}
