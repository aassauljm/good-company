/**
 * Development environment settings
 *
 * This file can include shared settings for a development team,
 * such as API keys or remote database passwords.  If you're using
 * a version control solution for your Sails app, this file will
 * be committed to your repository unless you add it to your .gitignore
 * file.  If your repository will be publicly viewable, don't add
 * any private information to this file!
 *
 */
var path = require('path');
var pkgJSON = require(path.resolve('package.json'));
var winston = require('winston');
var customLogger = new winston.Logger();

customLogger.add(winston.transports.Console, {
  level: 'silly',
  colorize: true,
  timestamp: true
});

module.exports = {

  /***************************************************************************
   * Set the default database connection for models in the development       *
   * environment (see config/connections.js and config/models.js )           *
   ***************************************************************************/
    hookTimeout: 40000,
    models: {
        connection: 'pg_test'
    },
    log: {
        custom: customLogger,
        inspect: false
    },
    serverRender: true,
    CACHE_DIR: '/tmp/.gc'
};
