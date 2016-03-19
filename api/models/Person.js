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
       /* personId: {
            type: Sequelize.INTEGER
        },*/
        companyNumber: {
            type: Sequelize.TEXT
        },
        address: {
            type: Sequelize.TEXT
        },
        attr: {
            type: Sequelize.JSON
        }
    },
    associations: function(){
        Person.belongsToMany(Holding, {
            foreignKey: {
                as: 'holdings',
                name: 'holderId'
            },
            through: 'holderJ'
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
    },
    options: {
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
            }
        },
        instanceMethods: {
            detailChange: function(other){
                // if name is same, but other details change
                return this.dataValues.name === other.name &&
                    this.dataValues.companyNumber === other.companyNumber &&
                    (this.dataValues.address !== other.address);
            },
            isEqual: function(other, options={}){
                if(other.personId && other.personId === this.dataValues.personId){
                    return true;
                }
                return this.dataValues.name === other.name &&
                    (this.dataValues.companyNumber || null) === (other.companyNumber || null) &&
                    (options.skipAddress || AddressService.compareAddresses(this.dataValues.address, other.address));
            },
            replaceWith: function(other){
                const person = Person.build(_.merge(other, {personId: this.dataValues.personId}), {
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