// api/models/LoginHistory.js

/* For recording time and IPs of logins.
*/
var _ = require('lodash');

const types = {
    IMPORT_COMPANY: 'IMPORT_COMPANY',
    SET_PASSWORD: 'SET_PASSWORD',
    CREATE_ACCOUNT: 'CREATE_ACCOUNT',
    ...require('../../config/enums/transactions')
};

module.exports = {
    _config: {
        actions: false,
        shortcuts: false,
        rest: false
    },
    associations: function() {
        ActivityLog.belongsTo(User, {
            as: 'user',
        });
    },
    attributes: {
        type: {
            type: Sequelize.ENUM.apply(null, _.values(types))
        },

        description: {
            type: Sequelize.STRING,
        },
        data: {
            type: Sequelize.JSON,
        },
    },
    options: {
        tableName: 'activity_log',
        classMethods: {
            types: types,
        },
        instanceMethods: {},
        hooks: {},
        timestamps: true,
    }
};