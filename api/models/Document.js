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
        },
        sourceUrl: {
            type: Sequelize.TEXT
        }
    },
    associations: function() {
        Document.belongsTo(User, {
            as: 'owner',
            foreignKey: {
                name: 'ownerId'

            }
        });
        Document.belongsTo(User, {
            as: 'createdBy',
            foreignKey: {
                name: 'createdById'
            }
        });
        Document.belongsTo(DocumentData, {
            as: 'documentData',
            foreignKey: {
                name: 'dataId'
            }
        });
        Document.belongsTo(DocumentData, {
            as: 'documentPreview',
            foreignKey: {
                name: 'previewId'
            }
        });
        Document.belongsTo(DocumentDirectory, {
            as: 'documentDirectory',
            foreignKey: {
                name: 'directoryId'
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