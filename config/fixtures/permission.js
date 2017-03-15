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



exports.create = function(roles, models) {
    sails.log.verbose('creating permissions');
    return Promise.all([
            grantAdminPermissions(roles, models),
            grantRegisteredPermissions(roles, models)
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

function grantRegisteredPermissions(roles, models) {
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

// TODO, make json file of this

var registered = {
    /*'Permission': [
        {
            action: 'read'
        }
    ],*/
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
        },
        {
            action: 'read',
            relation: 'organisation'
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
    /*'CompanyState': [
        {
            action: 'create'
        }
    ],*/
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


