// api/models/Directors.js

var _ = require('lodash');
var Promise = require('bluebird');


module.exports = {

    attributes: {
    },
    associations: function(){
        DirectorList.belongsToMany(Director, {
            as: 'directors',
            foreignKey: 'directors_id',
            through: 'd_d_j'
        });
        DirectorList.hasMany(CompanyState, {
            as: 'companyState',
            foreignKey: 'director_list_id'
        });
    },
    options: {
        freezeTableName: false,
        tableName: 'director_list',
        classMethods: {},
        instanceMethods: {
            buildNext: function(){
                return (this.dataValues.directors ? Promise.resolve(this.dataValues.directors) : this.getDirectors({include: [{model: Person, as: 'person'}]}))
                    .then(function(directors){
                        return DirectorList.build({directors: directors}, {include: [{model: Director, as: 'directors', include: [{model: Person, as: 'person'}]}]})
                    })
                    .then(function(directors){
                        directors.dataValues.directors.map(function(r){
                            r.isNewRecord = false;
                            r._changed = {};
                            r.dataValues.person.isNewRecord = false;
                            r.dataValues.person._changed = {};
                        });
                        return directors;
                    })
            }
        },
        hooks: {}
    }
};
