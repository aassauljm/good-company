// api/models/MbieApiBearerToken.js

module.exports = {

    attributes: {
        token: {
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
    options: {
        freezeTableName: false,
        tableName: 'mbie_api_bearer_token',
        classMethods: {},
        instanceMethods: {},
        hooks: {}
    }

}
