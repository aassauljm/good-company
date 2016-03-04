// api/models/DocumentLilst.js

var _ = require('lodash');

module.exports = {

    attributes: {
    },
    associations: function(){
        ShareClasses.belongsToMany(ShareClass, {
            as: 'shareClasses',
            foreignKey: 's_classes_id',
            through: 's_c_j'
        });
        ShareClasses.hasMany(CompanyState, {
            as: 'companyState',
            foreignKey: 's_classes_id'
        });
    },
    options: {
        freezeTableName: false,
        tableName: 'share_classes',
        classMethods: {},
        instanceMethods: {
            buildNext: function(){
                if(this.isNewRecord){
                    return this;
                }
                return this.getShareClasses()
                    .then(function(shareClasses){
                        return ShareClasses.build({shareClasses: shareClasses}, {include: [{model: ShareClasses, as: 'shareClasses'}]})
                    })
                    .then(function(shareClasses){
                        shareClasses.dataValues.shareClasses.map(function(r){
                            r.isNewRecord = false;
                            r._changed = {};
                        });
                        return shareClasses;
                    })
            }
        },
        hooks: {}
    }
};
