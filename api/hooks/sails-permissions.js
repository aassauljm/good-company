
module.exports = function(sails) {
    return {
        identity: 'permissions',
        /**
         * Local cache of Model name -> id mappings to avoid excessive database lookups.
         */
        _modelCache: {},

        configure: function() {
            if (!_.isObject(sails.config.permissions)) sails.config.permissions = {};
            sails.config.blueprints.populate = false;
        },
        initialize: function(next) {
            sails.log.info('permissions: initializing sails-permissions hook');
            if(sails.config.hooks.userPermissions === false){
                return next();
            }
            sails.after('hook:sequelize:loaded', function() {
                Model.count()
                    .then(function(count) {
                        if (count == sails.models.length) return next();
                        return initializeFixtures(sails)
                            .then(function() {
                                sails.emit('hook:permissions:loaded');
                                next();
                            });
                    })
                    .catch(function(error) {
                        sails.log.error(error);
                        next(error);
                    });
            });
        }
    };
};

/**
 * Install the application. Sets up default Roles, Users, Models, and
 * Permissions, and creates an admin user.
 */
function initializeFixtures(sails) {
    return (require('../../config/fixtures/model')[sails.config.skipFixtures ? 'queryModels' : 'createModels'])()
        .bind({})
        .then(function(models) {
            this.models = models;

            sails.hooks['sails-permissions']._modelCache = _.indexBy(models, 'name');

            return require('../../config/fixtures/role').create();
        })
        .then(function(roles) {
            this.roles = roles;

            /*
            var userModel = _.find(this.models, {
                name: 'User'
            });
            return require('../../config/fixtures/user').create(this.roles, userModel);
        })
        .then(function() {
            return User.findOne({
                email: sails.config.permissions.adminEmail
            });
        })
        .then(function(user) {
            sails.log.verbose('sails-permissions: created admin user:', user.toJSON());
            user.createdBy = user.id;
            user.owner = user.id;
            return user.save();
        })*/

            return require('../../config/fixtures/permission').create(this.roles, this.models);
        })
        .catch(function(error) {
            sails.log.error(error);
        });
}