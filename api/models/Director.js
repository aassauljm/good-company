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
        },
        data: {
            type: Sequelize.JSON
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
        instanceMethods: {
            buildNext: function(newPerson){
                if(this.isNewRecord){
                    return this;
                }
                const director = Director.build(_.merge({}, this.get(), {id: null}), {include: [{model: Person, as: 'person'}]})

                if(director.dataValues.person && !newPerson){
                    director.dataValues.person.isNewRecord = false;
                    director.dataValues.person._changed = {};
                }
                else if(newPerson){
                    director.dataValues.person.isNewRecord = true;
                    director.dataValues.person.id = director.dataValues.person.dataValues.id  = null;
                }
                return director;
            },
            isEqual: function(other, options={}){
                return this.dataValues.person.isEqual(other.person ? other.person : other);
            },
            setMbieData: function(data, date){
                this.set('data', {...this.dataValues.data, mbieData: {...data, fetchedDate: date}});

            }
        },
        hooks: {}
    }
};