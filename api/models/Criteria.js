// api/models/Criteria.js

var _ = require('lodash');

module.exports = {

	attributes: {
		where: { type: Sequelize.JSON },
		blacklist: { type: Sequelize.ARRAY(Sequelize.TEXT) }
	},
	associations: function(){
	    Criteria.belongsTo(Permission, {
            foreignKey: {
                as: 'permission',
                name: 'permissionId'
            }
        });
	},
    options: {
        freezeTableName: false,
        tableName: 'criteria', // Optional, but I suggest to set it
        classMethods: {},
        instanceMethods: {},
        hooks: {}
    }
};
