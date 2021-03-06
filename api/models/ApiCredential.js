// api/models/ApiCredential.js
const Promise = require('bluebird');
module.exports = {

    attributes: {
        accessToken: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        tokenType: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        refreshToken: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        expiresIn: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        service: {
            type: Sequelize.TEXT,
            allowNull: false
        }
    },
    associations: function() {
        ApiCredential.belongsTo(User, {
            as: 'owner',
            foreignKey: 'ownerId'
        });
        ApiCredential.belongsToMany(ApiCredentialScope, {
            as: 'scope',
            unique: true,
            through: 'api_credential_api_credential_scopes',
            foreignKey: 'apiCredentialId'
        });
    },
    options: {
        freezeTableName: false,
        tableName: 'api_credential',
        classMethods: {},
        instanceMethods: {
            addScopes: function(scopes) {
                return Promise.all(scopes.map(scope => {
                    return ApiCredentialScope
                        .findOrCreate({ where: { scope } })
                        .then(scopeInstances => this.addScope(scopeInstances[0]));
                }));
            }
        },
        hooks: {}
    }

}
