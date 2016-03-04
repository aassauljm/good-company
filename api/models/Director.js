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
        appointment: {
            type: Sequelize.DATE
        },
        consentUrl: {
            type: Sequelize.TEXT
        }
    },
    associations: function(n) {
        Director.belongsToMany(DirectorList, {
            as: 'director_list',
            foreignKey: 'director_id',
            through: 'd_d_j'
        });

        Director.belongsTo(Person, {
            as: 'person',
            foreignKey: {
                as: 'person',
                name: 'personId'
            }
        });

        Director.belongsTo(Entity, {
            as: 'entity',
            foreignKey: {
                name: 'directorId',
                as: 'entity'
            }
        });
    },

    options: {
        freezeTableName: false,
        tableName: 'director',
        classMethods: {},
        instanceMethods: {},
        hooks: {}
    }
};