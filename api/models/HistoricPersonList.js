// api/models/DocumentLilst.js

var _ = require('lodash');

module.exports = {

    attributes: {
    },
    associations: function(){
        HistoricPersonList.belongsToMany(Person, {
            as: 'persons',
            foreignKey: 'h_person_list_id',
            through: 'h_person_list_j'
        });
        HistoricPersonList.hasMany(CompanyState, {
            as: 'companyState',
            foreignKey: 'h_person_list_id'
        });
    },
    options: {
        freezeTableName: false,
        tableName: 'h_person_list',
        classMethods: {},
        instanceMethods: {
            buildNext: function(){
                return this.getPersons()
                    .then(function(persons){
                        return HistoricPersonList.build({persons: persons}, {include: [{model: Person, as: 'persons'}]})
                    })
                    .then(function(hPersons){
                        hPersons.dataValues.persons.map(function(r){
                            r.isNewRecord = false;
                            r._changed = {};
                        });
                        return hPersons;
                    })
            }
        },
        hooks: {}
    }
};
