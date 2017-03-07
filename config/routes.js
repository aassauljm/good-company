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
        model: 'user',
        action: 'userInfo'
    },

    'PUT /api/account_settings': {
        controller: 'UserController',
        action: 'accountSettings',
    },

    'GET /api/user': {
        controller: 'UserController',
        model: 'user',
        action: 'find'
    },

    'GET /api/user/:id': {
        controller: 'UserController',
        model: 'user',
        action: 'findOne'
    },

    'GET /api/recent_activity': {
        controller: 'UserController',
        model: 'user',
        action: 'recentActivity'
    },

    'POST /api/company': {
        controller: 'CompanyController',
        action: 'create'
    },

    'GET /api/company': {
        controller: 'CompanyController',
        model: 'company',
        action: 'find'
    },

    'DELETE /api/company/:id': {
        controller: 'CompanyController',
        model: 'company',
        action: 'destroy'
    },

    'GET /api/company/lookup': {
        controller: 'CompanyController',
        action: 'lookup'
    },
    'GET /api/company/lookup_own': {
        controller: 'CompanyController',
        action: 'lookupOwn'
    },

    'POST /api/favourites/:companyId': {
        controller: 'FavouriteController',
        action: 'addFavourite'
    },

    'GET /api/favourites': {
        controller: 'FavouriteController',
        action: 'favourites'
    },

    'POST /api/favourites/:companyId': {
        controller: 'FavouriteController',
        action: 'addFavourite'
    },

    'DELETE /api/favourites/:companyId': {
        controller: 'FavouriteController',
        action: 'removeFavourite'
    },

    'GET /api/recent_activity/full': {
        controller: 'UserController',
        modelIdentity: 'user',
        action: 'recentActivityFull'
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

    'POST /api/user/validate': {
        controller: 'UserController',
        action: 'validateUser'
    },

    'POST /api/document/upload_document': {
        controller: 'DocumentController',
        action: 'uploadDocument',
        model: 'document'
    },

    'GET /api/document/get_document/:id': {
        controller: 'DocumentController',
        action: 'getDocument',
        model: 'document'
    },

    'GET /api/document/get_document_preview/:id': {
        controller: 'DocumentController',
        action: 'getDocumentPreview',
        model: 'document'
    },

    'GET /api/document': {
        controller: 'DocumentController',
        model: 'document',
        action: 'find'
    },

    'GET /api/document/:id': {
        controller: 'DocumentController',
        model: 'document',
        action: 'findOne'
    },

    'PUT /api/document/:id': {
        controller: 'DocumentController',
        model: 'document',
        action: 'update'
    },

    'POST /api/company/import/validate': {
        controller: 'CompanyController',
        action: 'validate'
    },

    'POST /api/transaction/:type/:id': {
        controller: 'CompanyStateController',
        model: 'company',
        action: 'create'
    },

    'DELETE /api/company/:id/transactions/:transactionIds': {
        controller: 'CompanyStateController',
        model: 'company',
        action: 'deleteTransactions'
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
    'GET /api/company/:id/at_date/:date': {
        controller: 'CompanyController',
        action: 'atDate',
        modelIdentity: 'company'
    },

    'GET /api/company/:id/root': {
        controller: 'CompanyController',
        action: 'root',
        modelIdentity: 'company'
    },
    'GET /api/company/:id/transactions': {
        controller: 'CompanyController',
        action: 'transactionHistory',
        model: 'company'
    },
    'GET /api/company/:id/issues': {
        controller: 'CompanyController',
        action: 'issueHistory',
        model: 'company'
    },
    'GET /api/company/:id/share_register': {
        controller: 'CompanyController',
        action: 'shareRegister',
        model: 'company'
    },
    'GET /api/company/:id/interests_register': {
        controller: 'CompanyController',
        action: 'interestsRegister',
        model: 'company'
    },
    'GET /api/company/:id/shareholders': {
        controller: 'CompanyController',
        action: 'shareholders',
        model: 'company'
    },
    'POST /api/company/import/companiesoffice/:companyNumber': {
        controller: 'CompanyController',
        action: 'import'
    },
    'POST /api/company/import_bulk/companiesoffice': {
        controller: 'CompanyController',
        action: 'importBulk'
    },
    'POST /api/bulk/transaction': {
        controller: 'CompanyController',
        action: 'transactionBulk'
    },

    'GET /api/address/lookup/:query': {
        controller: 'AddressController',
        action: 'lookup'
    },

    'POST /api/company/:id/interests_register/create': {
        controller: 'CompanyStateController',
        action: 'createRegisterEntry',
        model: 'company'
    },

    'POST /api/company/:id/share_classes/create': {
        controller: 'CompanyStateController',
        action: 'createShareClass',
        model: 'company'
    },

    'PUT /api/company/:id/share_classes/:shareClassId': {
        controller: 'CompanyStateController',
        action: 'updateShareClass',
        model: 'company'
    },

    'GET /api/company/render/:id/shareregister': {
        controller: 'RenderController',
        action: 'renderShareRegister',
        model: 'company'
    },

    'POST /api/render_template': {
        controller: 'RenderController',
        action: 'renderTemplate',
    },

    'POST /api/send_template': {
        controller: 'RenderController',
        action: 'sendTemplate',
    },

    'GET /echo_file': {
        controller: 'RenderController',
        'action': 'echo'
    },

    'GET /api/company/:id/recent_activity': {
        controller: 'CompanyController',
        action: 'recentActivity',
        model: 'company'
    },

    'GET /api/company/:id/source_data': {
        controller: 'CompanyController',
        action: 'getSourceData',
        model: 'company'
    },

    'PUT /api/company/:id/update_source_data': {
        controller: 'CompanyController',
        action: 'updateSourceData',
        model: 'company'
    },

    'GET /api/company/:id/pending_history': {
        controller: 'CompanyController',
        action: 'getPendingHistoricActions',
        model: 'company'
    },

    'POST /api/company/:id/import_pending_history': {
        controller: 'CompanyController',
        action: 'importPendingHistory',
        model: 'company'
    },

    'POST /api/company/:id/import_pending_history_until_ar': {
        controller: 'CompanyController',
        action: 'importPendingHistoryUntilAR',
        model: 'company'
    },

    'POST /api/company/:id/import_pending_history_until': {
        controller: 'CompanyController',
        action: 'importPendingHistoryUntil',
        model: 'company'
    },

    'PUT /api/company/:id/update_pending_history': {
        controller: 'CompanyController',
        action: 'updatePendingHistory',
        model: 'company'
    },


     'PUT /api/company/:id/reset_pending_history': {
        controller: 'CompanyController',
        action: 'resetPendingHistory',
        model: 'company'
    },

    'GET /api/company/:id/historic_holders': {
        controller: 'CompanyController',
        action: 'getHistoricHolders',
        model: 'company'
    },

    'GET /api/pending_jobs': {
        controller: 'UserController',
        model: 'user',
        action: 'pendingJobs'
    },

    'GET /api/alerts': {
        controller: 'UserController',
        model: 'user',
        action: 'alerts'
    },


    'POST /api/admin/billing': {
        controller: 'AdminController',
        action: 'billingInfo'
    },

    'GET /api/auth-with/:service': {
        controller: 'ApiCredentialController',
        action: 'mbie'
    },

    'DELETE /api/auth-with/:service': {
        controller: 'ApiCredentialController',
        action: 'removeAuth'
    },

    'GET /companies_office_cb': {
        controller: 'ApiCredentialController',
        action: 'companies_office_cb'
    },

    'GET /api/nzbn': {
        controller: 'ApiCredentialController',
        action: 'authorisedCompanies'
    },

    'GET /api/events': {controller: 'EventController', event: 'event', action: 'find'},
    'POST /api/event': {controller: 'EventController', event: 'event', action: 'create'},
    'GET /api/event/:id': {controller: 'EventController', event: 'event', action: 'findOne'},
    'PUT /api/event/:id': {controller: 'EventController', event: 'event', action: 'update'},
    'DELETE /api/event/:id': {controller: 'EventController', event: 'event', action: 'destroy'},



    'GET /api/model': {controller: 'ModelController', model: 'model', action: 'find'},
    'POST /api/model': {controller: 'ModelController', model: 'model', action: 'create'},
    'GET /api/model/:id': {controller: 'ModelController', model: 'model', action: 'findOne'},
    'PUT /api/model/:id': {controller: 'ModelController', model: 'model', action: 'update'},
    'DELETE /api/model/:id': {controller: 'ModelController', model: 'model', action: 'destroy'}
};
