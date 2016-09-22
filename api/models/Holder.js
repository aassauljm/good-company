/**
 * DirectorJ.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
var Promise = require('bluebird');

module.exports = {
    _config: {
        actions: false,
        shortcuts: false,
        rest: false
    },

    attributes: {
        data: {
            type: Sequelize.JSON
        }
    },
    associations: function(n) {
        Holder.belongsTo(Holding, {
            as: 'holding',
            foreignKey: 'holdingId',
        });

        Holder.belongsTo(Person, {
            as: 'person',
            foreignKey: {
                as: 'person',
                name: 'holderId'
            }
        });
    },

    options: {
        indexes: [
            {name: 'holder_holderId_idx', fields: ['holderId']},
            {name: 'holder_holdingId_idx', fields: ['holdingId']}
            ],
        freezeTableName: false,
        tableName: 'holder',
        classMethods: {},
        instanceMethods: {
            buildNext: function(){
                if(this.isNewRecord){
                    return this;
                }
                const holder = Holder.build(_.merge({}, this.get(), {id: null, holdingId: null, holderId: null}), {include: [{model: Person, as: 'person'}]});

                if(holder.dataValues.person){
                    holder.dataValues.person.isNewRecord = false;
                    holder.dataValues.person._changed = {};
                }
                return holder;
            },
            detailChange: function(other){
                // if name is same, but other details change
                return this.dataValues.person.detailChange(other.person ? other.person : other);
            },
            isEqual: function(other, options={}){
                return this.dataValues.person.isEqual(other.person ? other.person : other);
            },
            buildFull: function(attr){
                return Holder.build(attr, {include: [{model: Person, as: 'person'}]});
            }
        },
        hooks: {}
    }
};