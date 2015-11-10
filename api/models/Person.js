/**
 * Person.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */


module.exports = {

    attributes: {
        name: {
            type: Sequelize.TEXT
        },
        companyNumber: {
            type: Sequelize.TEXT
        },
        address: {
            type: Sequelize.TEXT
        }
    },
    associations: function(){
        Person.belongsToMany(Holding, {
            foreignKey: {
                as: 'holdings',
                name: 'holdingId'
            },
            through: 'holdingJ'
        });
        Person.belongsToMany(CompanyState, {
            foreignKey: {
                as: 'companyState',
                name: 'companyStateId'
            },
            through: DirectorJ
        });
    },
    options: {
        freezeTableName: false,
        tableName: 'person',
        classMethods: {},
        instanceMethods: {},
        hooks: {}
    }

};