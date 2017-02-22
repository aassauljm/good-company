// api/models/ApiCredential.js

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
        scope: {
            type: Sequelize.TEXT,
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
            foreignKey: {
                name: 'ownerId'
            }
        });
    },
    options: {
        freezeTableName: false,
        tableName: 'api_credential',
        classMethods: {},
        instanceMethods: {},
        hooks: {}
    }

}