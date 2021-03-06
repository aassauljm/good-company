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
        connection: 'pg_test',
        migrate: 'safe'
    },
    log: {
        custom: customLogger,
        inspect: false
    },
    serverRender: true,
    renderServiceUrl: 'http://localhost:5671/render', //'https://convert.catalex.nz'
    companyInfoServiceUrl: 'http://localhost:5670',
    GOOD_COMPANIES_LOGIN_URL: 'http://localhost:5667/auth/catalex/login',
    USERS_LOGIN_URL: 'http://localhost:8000/good-companies-login',
    ACCOUNT_URL: 'http://localhost:8000',
    OAUTH_ACCESS_TOKEN_URL: 'http://localhost:8000/oauth/access_token',
    USER_RESOURCE_URL: 'http://localhost:8000/api/user',
    USER_LOGOUT_URL: 'http://localhost:8000/auth/logout',
    OAUTH_CLIENT_ID: 'gc',
    OAUTH_CLIENT_SECRET: 'gc',
    CACHE_DIR: '/tmp/.gc',
    APP_URL: 'http://localhost:5667',
    EMAIL_URL: 'http://localhost:8000/mail/send',
    ADMIN_KEY: 'gc',
    COMPANIES_OFFICE_URL: 'https://www.companiesoffice.govt.nz/',

    mbie: {
        nzbn: {
            url: 'https://sandbox.api.business.govt.nz/services/',
            consumerKey: 'xxxxx',
            consumerSecret: 'xxxxx',

            oauth: {
                url: 'https://www.eat.nzbn.govt.nz/oauth-service/oauth/',
                clientId: 'xxxxx',
                consumerKey: 'xxxxx',
                consumerSecret: 'xxxxx'
            },
        },

        companiesOffice: {
            url: "https://api.eat.business.govt.nz/services/v0.5/companies-office/companies-register/",
            oauth: {
                url: 'https://api.eat.business.govt.nz/oauth2/',
                clientId: 'xxxxx',
                consumerKey: 'xxxxx',
                consumerSecret: 'xxxxx'
            }
        }
    }
};
