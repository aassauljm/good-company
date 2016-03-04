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
        InterestsRegister.hasMany(CompanyState, {
            as: 'companyState',
            notNull: true,
            foreignKey: 'register_id'
        });
    },
    options: {
        freezeTableName: false,
        tableName: 'interests_register',
        classMethods: {},
        instanceMethods: {
            buildNext: function(){
                if(this.isNewRecord){
                    return this;
                }
                return this.getEntries()
                    .then(function(entries){
                        return InterestsRegister.build({entries: entries}, {include: [{model: InterestsEntry, as: 'entries'}]})
                    })
                    .then(function(register){
                        register.dataValues.entries.map(function(r){
                            r.isNewRecord = false;
                            r._changed = {};
                        });
                        return register;
                    })
            }

        },
        hooks: {}
    }
};
