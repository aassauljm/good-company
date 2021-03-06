/**
 * Person.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */


module.exports = {

    attributes: {
        name: {
            type: Sequelize.TEXT
        },
        companyNumber: {
            type: Sequelize.TEXT
        },
        address: {
            type: Sequelize.TEXT
        },
        attr: {
            type: Sequelize.JSONB
        }
    },
    associations: function(){
        Person.hasMany(Holder, {
            as: 'holder',
            foreignKey: {
                name: 'holderId',
                as: 'holderships',
            }
        });
        Person.hasMany(Director, {
            as: 'directorships',
            foreignKey: {
                name: 'personId',
                as: 'directorships',
            }
        });
        Person.belongsTo(Transaction, {
            as: 'transaction',
            foreignKey: {
                name: 'transactionId',
                as: 'transaction'
            }
        });
        Person.belongsTo(Entity, {
            as: 'entity',
            foreignKey: {
                name: 'personId',
                as: 'entity'
            }
        });
        Person.belongsTo(User, {
            as: 'owner',
            foreignKey: {
                name: 'ownerId'
            }
        });
        Person.belongsTo(User, {
            as: 'createdBy',
            foreignKey: {
                name: 'createdById'
            }
        });

        Person.belongsToMany(HistoricPersonList, {
            as: 'historicPersonList',
            foreignKey: 'person_id',
            through: 'h_person_list_j'
        });

    },
    options: {
        indexes: [{name: 'person_person_id', fields: ['personId']}],
        freezeTableName: false,
        tableName: 'person',
        classMethods: {
            buildFull: function(data){
                return Person.build(data, {
                        include: [{
                            model: Transaction,
                            as: 'transaction',
                        }]
                    });
            },
            toJSON: function(){
                return _.omit(this.get({plain: true}), 'ownerId', 'createdBy');
            }
        },
        instanceMethods: {
            detailChange: function(other){
                // if name is same, but other details change
                return this.dataValues.name.toLowerCase() === other.name.toLowerCase() &&
                    this.dataValues.companyNumber === other.companyNumber &&
                    (this.dataValues.address !== other.address || JSON.stringify(this.dataValues.attr) !== JSON.stringify(other.attr));
            },

            isEqual: function(other, options={}){
                if(other.personId){
                    return this.dataValues.personId === other.personId;
                }
                if(this.dataValues.companyNumber && other.companyNumber){
                    return this.dataValues.name.toLowerCase() === other.name.toLowerCase() && this.dataValues.companyNumber === other.companyNumber
                }
                return this.dataValues.name.toLowerCase() === other.name.toLowerCase() &&
                    (this.dataValues.companyNumber || null) === (other.companyNumber || null) &&
                    (options.skipAddress || AddressService.compareAddresses(this.dataValues.address, other.address));
            },

            replaceWith: function(other){
                if(other.id){
                    return other;
                }
                if(!other.address){
                    other = {...other};
                    delete other.address;
                }
                const person = Person.build(_.merge(_.pick(this.toJSON(), 'attr'), other, {personId: this.dataValues.personId}), {
                                include: [{
                                    model: Transaction,
                                    as: 'transaction',
                                }]
                            });
                return person;
            }

        },
        hooks: {
        }
    }

};