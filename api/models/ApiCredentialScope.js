// api/models/ApiCredential.js

module.exports = {

    attributes: {
        scope: {
            type: Sequelize.TEXT,
            allowNull: false
        }
    },
    associations: function() {
        ApiCredentialScope.belongsToMany(ApiCredential, {
            as: 'apiCredentials',
            unique: true,
            through: 'api_credential_api_credential_scopes',
            foreignKey: 'scopeId'
        });
    },
    options: {
        freezeTableName: false,
        tableName: 'api_credential_scope',
        classMethods: {},
        instanceMethods: {},
        hooks: {}
    }

}
