// api/models/Criteria.js

var _ = require('lodash');

module.exports = {

    attributes: {
        date: {
            type: Sequelize.DATE
        },
        details: {
            type: Sequelize.TEXT
        }
    },
    associations: function(){
        InterestsEntry.belongsToMany(InterestsRegister, {
            as: 'registry',
            foreignKey: 'entry_id',
            through: 'ie_ir_j'
        });
        InterestsEntry.belongsToMany(Document, {
            as: 'documents',
            foreignKey: 'entry_id',
            through: 'ie_d_j'
        });
        InterestsEntry.belongsToMany(Person, {
            as: 'persons',
            foreignKey: {
                as: 'persons',
                name: 'registry_entry_id'
            },
            through: 're_p_j'
        });
    },
    options: {
        freezeTableName: false,
        tableName: 'interests_entry',
        classMethods: {},
        instanceMethods: {

        },
        hooks: {}
    }
};
