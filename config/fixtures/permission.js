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


exports.create = function(roles, models) {
    sails.log.verbose('creating permissions');
    return Promise.all([
            grantAdminPermissions(roles, models),
            grantStandardPermissions(roles, models)
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



function grantStandardPermissions(roles, models) {
    return Promise.all(permissions.map(perm => {
        const permission =  {
            modelId: _.find(models, {
                name: perm.model
            }).id,
            action: perm.action,
            relation: perm.relation,
            roleId: (_.find(roles, {
                name: perm.role
            }) || []).id || null,
        }
        return Permission.findOrCreate({
            where: permission,
            defaults: permission
        });
    }));
}



var permissions = [
    {model: 'User', action: 'read', relation: 'owner'},
    {model: 'User', action: 'update', relation: 'owner'},
    {model: 'User', action: 'update', relation: 'organisation_admin'},

    {model: 'Document', action: 'create', relation: 'role', role: 'subscribed' },
    {model: 'Document', action: 'read', relation: 'owner' },
    {model: 'Document', action: 'update', relation: 'owner' },
    {model: 'Document', action: 'delete', relation: 'owner' },
    {model: 'Document', action: 'read', relation: 'organisation' },
    {model: 'Document', action: 'update', relation: 'organisation' },
    {model: 'Document', action: 'delete', relation: 'organisation' },

    {model: 'Company', action: 'create', relation: 'role', role: 'subscribed' },
    {model: 'Company', action: 'create', relation: 'role', role: 'organisationMember' },
    {model: 'Company', action: 'read', relation: 'owner'},
    {model: 'Company', action: 'update', relation: 'owner'},
    {model: 'Company', action: 'delete', relation: 'owner'},
    {model: 'Company', action: 'read', relation: 'organisation'},
    {model: 'Company', action: 'update', relation: 'organisation'},

    {model: 'Favourite', action: 'create', relation: 'role', role: 'subscribed' },
    {model: 'Favourite', action: 'read', relation: 'owner'},
    {model: 'Favourite', action: 'update', relation: 'owner'},
    {model: 'Favourite', action: 'delete', relation: 'owner'},

    {model: 'Event', action: 'create', relation: 'role', role: 'subscribed' },
    {model: 'Event', action: 'read', relation: 'owner'},
    {model: 'Event', action: 'update', relation: 'owner'},
    {model: 'Event', action: 'delete', relation: 'owner'},

    {model: 'ApiCredential', action: 'create', relation: 'role', role: 'subscribed' },
    {model: 'ApiCredential', action: 'read', relation: 'owner'},
    {model: 'ApiCredential', action: 'delete', relation: 'owner'},
]

