/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes map URLs to views and controllers.
 *
 * If Sails receives a URL that doesn't match any of the routes below,
 * it will check for matching files (images, scripts, stylesheets, etc.)
 * in your assets directory.  e.g. `http://localhost:1337/images/foo.jpg`
 * might match an image file: `/assets/images/foo.jpg`
 *
 * Finally, if those don't match either, the default 404 handler is triggered.
 * See `api/responses/notFound.js` to adjust your app's 404 logic.
 *
 * Note: Sails doesn't ACTUALLY serve stuff from `assets`-- the default Gruntfile in Sails copies
 * flat files from `assets` to `.tmp/public`.  This allows you to do things like compile LESS or
 * CoffeeScript for the front-end.
 *
 * For more information on configuring custom routes, check out:
 * http://sailsjs.org/#!/documentation/concepts/Routes/RouteTargetSyntax.html
 */

module.exports.routes = {

    /***************************************************************************
     *                                                                          *
     * Make the view located at `views/homepage.ejs` (or `views/homepage.jade`, *
     * etc. depending on your default view engine) your home page.              *
     *                                                                          *
     * (Alternatively, remove this and add an `index.html` file in your         *
     * `assets` directory)                                                      *
     *                                                                          *
     ***************************************************************************/

    '/': {
        controller: 'LandingController',
        action: 'landing'
    },


    'GET /logout': 'AuthController.logout',

    'POST /auth/local': 'AuthController.callback',
    'POST /auth/local/:action': 'AuthController.callback',

    'GET /auth/:provider': 'AuthController.provider',
    'GET /auth/:provider/callback': 'AuthController.callback',
    'GET /auth/:provider/:action': 'AuthController.callback',


    'GET /api/get_info': {
        controller: 'UserController',
        modelIdentity: 'user',
        action: 'userInfo'
    },

    'PUT /api/set_password': {
        controller: 'UserController',
        modelIdentity: 'user',
        action: 'setPassword',
        blacklist: ['oldPassword']
    },

    'POST /api/user/signup': {
        controller: 'UserController',
        action: 'signup'
    },

    'POST /api/document/upload_document': {
        controller: 'DocumentController',
        action: 'uploadDocument',
        modelIdentity: 'document'
    },

    'GET /api/document/get_document/:id': {
        controller: 'DocumentController',
        action: 'getDocument',
        modelIdentity: 'document'
    },

    'GET /api/document/get_document_preview/:id': {
        controller: 'DocumentController',
        action: 'getDocumentPreview',
        modelIdentity: 'document'
    },
    'GET /api/document': {
        controller: 'DocumentController',
        modelIdentity: 'document',
        action: 'find'
    },

    'POST /api/company/import/validate': {
        controller: 'CompanyController',
        action: 'validate'
    },

    'POST /api/transaction/:type/:companyId': {
        controller: 'CompanyStateController',
        action: 'create'
    },
    'GET /api/company/:id/get_info': {
        controller: 'CompanyController',
        action: 'getInfo',
        modelIdentity: 'company'
    },
    'GET /api/company/:id/history/:generation': {
        controller: 'CompanyController',
        action: 'history',
        modelIdentity: 'company'
    },
    'GET /api/company/:id/transactions': {
        controller: 'CompanyController',
        action: 'transactionHistory',
        modelIdentity: 'company'
    },
    'POST /api/company/import/companiesoffice/:companyNumber': {
        controller: 'CompanyController',
        action: 'import'
    },
    'GET /api/company/lookup/:query': {
        controller: 'CompanyController',
        action: 'lookup'
    },
};