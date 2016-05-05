

module.exports = {
    _config: {
        actions: false,
        shortcuts: false,
        rest: false
    },
    attributes: {
    },
    associations: function() {
        Favourite.belongsTo(User, {
            as: 'user',
            foreignKey: {
                name: 'userId'
            }
        });
        Favourite.belongsTo(Company, {
            as: 'company',
            foreignKey: {
                name: 'companyId'
            }
        });

    },

    options: {
        freezeTableName: false,
        tableName: 'favourite', // Optional, but I suggest to set it
        classMethods: {},
        instanceMethods: {},
        hooks: {}
    }
};