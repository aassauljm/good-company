/**
 * DirectorJ.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
    _config: {
        actions: false,
        shortcuts: false,
        rest: false
    },

    attributes: {
        attr: {
            type: Sequelize.JSON
        }
    },
    associations: function() {
      //  HolderJ.belongsTo(Holding, {
            //foreignKey: 'holdingId',
       //     as: 'holding'
      //  });

        //HolderJ.belongsTo(Person, {
        //    as: 'holder',
            //foreignKey: 'holderId',
       // });
    },

    options: {
        freezeTableName: false,
        tableName: 'holder_j',
        classMethods: {},
        instanceMethods: {},
        hooks: {}
    }
};