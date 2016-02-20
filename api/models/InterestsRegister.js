// api/models/Criteria.js

var _ = require('lodash');

module.exports = {

    attributes: {
    },
    associations: function(){
        InterestsRegister.belongsToMany(InterestsEntry, {
            as: 'entries',
            foreignKey: 'register_id',
            through: 'ie_ir_j'
        });
        InterestsRegister.belongsToMany(CompanyState, {
            as: 'companyState',
            notNull: true,
            foreignKey: 'register_id',
            through: 'ir_j'
        });
    },
    options: {
        freezeTableName: false,
        tableName: 'interests_register',
        classMethods: {},
        instanceMethods: {},
        hooks: {}
    }
};
