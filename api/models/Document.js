/**
 * Document.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
    _config: {
        actions: false,
        shortcuts: false,
        rest: true
    },
    attributes: {
        filename: {
            type: Sequelize.TEXT
        },
        type: {
            type: Sequelize.TEXT
        }
    },
    associations: function() {
        Document.belongsTo(User, {
            as: 'owner',
            foreignKey: {
                name: 'owner_id'

            }
        });
        Document.belongsTo(User, {
            as: 'createdBy',
            foreignKey: {
                name: 'createdBy_id'
            }
        });
        Document.belongsTo(DocumentData, {
            as: 'documentData',
            foreignKey: {
                name: 'data_id'
            }
        });
        Document.belongsTo(DocumentData, {
            as: 'documentPreview',
            foreignKey: {
                name: 'preview_id'
            }
        });
        Document.belongsTo(DocumentDirectory, {
            as: 'documentDirectory',
            foreignKey: {
                name: 'directory_id'
            }
        });
    },

    options: {
        freezeTableName: false,
        tableName: 'document', // Optional, but I suggest to set it
        classMethods: {},
        instanceMethods: {},
        hooks: {}
    }
};