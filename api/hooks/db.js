var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));


const ORDERED_DB_SCRIPTS = ['config/db/functions.sql']


function populate() {
    return Promise.each(ORDERED_DB_SCRIPTS, (file) => fs.readFileAsync(file, 'utf8').then(sql => sequelize.query(sql)))
        .then(function(){
            return sequelize.query('SELECT reset_sequences();')
        })
}

module.exports = function(sails) {
    return {
        identity: 'db',
        /**
         * Local cache of Model name -> id mappings to avoid excessive database lookups.
         */
        _modelCache: {},

        configure: function() {

        },

        initialize: function(next) {
            sails.log.info('loading db functions');
            if(sails.config.fixtures === false || !__DEV__){
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