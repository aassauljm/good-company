var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));


const ORDERED_DB_SCRIPTS = [
    'config/db/acls.sql',
    'config/db/functions.sql',
    'config/db/shareRegister.sql',
    'config/db/admin.sql',
    ]


function populate() {
    return Promise.each(ORDERED_DB_SCRIPTS, (file) => fs.readFileAsync(file, 'utf8').then(sql => sequelize.query(sql)))
}

module.exports = function(sails) {
    return {
        identity: 'db',
        configure: function() { },

        initialize: function(next) {
            sails.log.info('loading db functions');
            if(sails.config.hooks.fixtures === false || !__DEV__){
                return next();
            }
            sails.after('hook:sequelize:loaded', function() {
                return populate()
                    .then(() => {
                        next();
                    })
            })
        },
        populate: populate,
        ORDERED_DB_SCRIPTS: ORDERED_DB_SCRIPTS
    };
};