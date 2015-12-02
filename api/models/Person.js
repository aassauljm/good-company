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
        personId: {
            type: Sequelize.INTEGER
        },
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
                name: 'holdingId'
            },
            through: 'holdingJ'
        });
        Person.hasMany(Director, {
            as: 'directorships',
            foreignKey: {
                name: 'personId',
                as: 'directorships',
            }
        });
    },
    options: {
        freezeTableName: false,
        tableName: 'person',
        classMethods: {},
        instanceMethods: {
            detailChange: function(other){
                // if name is same, but other details change
                return this.dataValues.name === other.name &&
                    (this.dataValues.companyNumber !== other.companyNumber ||
                    this.dataValues.address !== other.address);
            },
            isEqual: function(other){
                return this.dataValues.name === other.name &&
                    this.dataValues.companyNumber === other.companyNumber &&
                    this.dataValues.address === other.address;
            },
            replaceWith: function(other){
                return Person.build(_.merge({personId: this.dataValues.personId}, other));
            }

        },
        hooks: {
            afterSync: [function addAutoIncrement(){
                return sequelize.query(`CREATE SEQUENCE person_id_sequence;
                                       ALTER TABLE person ALTER COLUMN "personId" SET DEFAULT nextval('person_id_sequence');
                                       ALTER SEQUENCE person_id_sequence OWNED BY person."personId"; `)
                    .catch(function(){
                        // sequence exists, ignore
                    })

            }]
        }
    }

};