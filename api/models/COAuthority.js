/**
 * Company.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
const uuid = require('node-uuid');
const Promise = require('bluebird')

module.exports = {
    attributes: {
        allowed: {
            type: Sequelize.BOOLEAN,
            defaultValue: true
        }
    },
    associations: function() {
        COAuthority.belongsTo(User, {
            as: 'user,
            foreignKey: {
                onDelete: 'cascade',
                as: 'user',
                name: 'userId'
            }
        });
        COAuthority.belongsTo(Company, {
            as: 'company',
            foreignKey: {
                onDelete: 'cascade',
                as: 'company',
                name: 'companyId'

            }
        });

    },
    options: {
        tableName: 'co_authority',
        freezeTableName: false,
        indexes: [{
            unique: true,
            name: 'co_authority_idx',
            fields: ['userId', 'companyId']
        }]
    }
}