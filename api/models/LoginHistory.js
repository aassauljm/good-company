// api/models/LoginHistory.js

/* For recording time and IPs of logins.
*/
var _ = require('lodash');



module.exports = {
    _config: {
        actions: false,
        shortcuts: false,
        rest: false
    },
    associations: function() {
        LoginHistory.belongsTo(User, {
            as: 'user',
        });

        LoginHistory.belongsTo(RequestLog, {
            as: 'request',
            foreignKey: {
                name: 'requestId'
            }
        });
    },
    attributes: {
    },
    options: {
        tableName: 'login_history',
        classMethods: {},
        instanceMethods: {},
        hooks: {},
        timestamps: true,
    }
};