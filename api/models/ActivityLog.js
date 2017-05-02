// api/models/LoginHistory.js

/* For recording time and IPs of logins.
*/
var _ = require('lodash');

const types = {
    IMPORT_COMPANY: 'IMPORT_COMPANY',
    IMPORT_COMPANY_FAIL: 'IMPORT_COMPANY_FAIL',
    SET_PASSWORD: 'SET_PASSWORD',
    CREATE_ACCOUNT: 'CREATE_ACCOUNT',
    UPDATE_PENDING_HISTORY: 'UPDATE_PENDING_HISTORY',
    COMPLETE_IMPORT_HISTORY: 'COMPLETE_IMPORT_HISTORY',
    IMPORT_HISTORY_FAIL: 'IMPORT_HISTORY_FAIL',
    RESET_PENDING_HISTORY: 'RESET_PENDING_HISTORY',
    DELETE_COMPANY: 'DELETE_COMPANY',
    ...require('../../config/enums/transactions').enums
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
        ActivityLog.belongsTo(Company, {
            as: 'company',
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
            query: function(userId, companyId, limit){
                if(companyId){
                    return sequelize.query("select activity_log_json(:userId, :companyId, :limit)",
                                   { type: sequelize.QueryTypes.SELECT,
                                    replacements: {userId: userId || null, companyId: companyId || null, limit: limit || null}})
                        .then(r => r[0].activity_log_json)
                }
                else{
                    return sequelize.query("select activity_log_all_json(:userId, :limit)",
                                   { type: sequelize.QueryTypes.SELECT,
                                    replacements: {userId: userId || null, companyId: companyId || null, limit: limit || null}})
                        .then(r => r[0].activity_log_all_json)
                }
            }
        },
        instanceMethods: {},
        hooks: {},
        timestamps: true,
    }
};