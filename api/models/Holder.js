/**
 * Holder.js
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
        }
    },
    associations: function() {
        Holder.belongsToMany(Holding, {
            foreignKey: {
                as: 'holdings',
                name: 'holdingId'
            },
            through: 'holdingJ'
        });
    },
    options: {
        freezeTableName: false,
        tableName: 'holder',
        classMethods: {},
        instanceMethods: {},
        hooks: {}
    }

};