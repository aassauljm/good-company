// api/models/DocumentLilst.js

var _ = require('lodash');

module.exports = {

    attributes: {
    },
    associations: function(){
        DocumentList.belongsToMany(Document, {
            as: 'documents',
            foreignKey: 'doc_list_id',
            through: 'doc_list_j'
        });
        DocumentList.hasMany(CompanyState, {
            as: 'companyState',
            foreignKey: 'doc_list_id'
        });
    },
    options: {
        freezeTableName: false,
        tableName: 'doc_list',
        classMethods: {},
        instanceMethods: {
            buildNext: function(){
                return this.getDocuments()
                    .then(function(documents){
                        return DocumentList.build({document: documents}, {include: [{model: Documents, as: 'documents'}]})
                    })
                    .then(function(docList){
                        docList.dataValues.documents.map(function(r){
                            r.isNewRecord = false;
                            r._changed = {};
                        });
                        return docList;
                    })
            }
        },
        hooks: {}
    }
};
