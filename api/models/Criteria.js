// api/models/Criteria.js

var _ = require('lodash');
/*var _super = require('sails-permissions/api/models/Criteria');

_.merge(exports, _super);
_.merge(exports, {

  // Extend with custom logic here by adding additional fields, methods, etc.

});
*/

module.exports = {
	autoCreatedBy: false,


	attributes: {
		where: { type: Sequelize.JSON },
		blacklist: { type: Sequelize.ARRAY }
	},
	associations: function(){
		Criteria.hasOne(Permission, {foreignKey: {name: 'criteria'}});
	}
};
