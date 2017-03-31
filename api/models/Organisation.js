var Promise = require('bluebird');

module.exports = {


    attributes: {
        organisationId: {
            type: Sequelize.INTEGER
        },
        catalexId: {
            type: Sequelize.TEXT
        },
        name: {
            type: Sequelize.TEXT
        },
        email: {
            type: Sequelize.TEXT
        },
        roles: {
            type: Sequelize.ARRAY(Sequelize.TEXT)
        }
    },
    associations: function(){

    },
    options: {
            indexes: [
                {name: 'organisation_idx_organisationId', fields: ['organisationId']},
                {name: 'organisation_idx_catalexId', fields: ['catalexId']
            }],

        tableName: 'organisation',
        classMethods: {
            updateOrganisation: Promise.method(function(organisation){
                if(!organisation){
                    return
                }
                return Organisation.destroy({where: {organisationId: organisation.organisation_id}})
                    .then(() => {
                        return Organisation.bulkCreate(organisation.members.map(member => ({
                            organisationId: organisation.organisation_id,
                            catalexId: member.id.toString(),
                            name: member.name,
                            email: member.email,
                            roles: member.roles
                        })))
                    })
            })
        },
        instanceMethods: {},
        hooks: {},
        timestamps: false,
    }
};