var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
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

    'GET /api/version': function (req, res) {
        res.json({ ASSET_HASH: __DEV__ ? false : sails.config.ASSET_HASH });
    },

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
        method: 'update',
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

    'POST /api/favourites/:id': {
        controller: 'FavouriteController',
        action: 'addFavourite',
        model: 'company',
        method: 'read'
    },

    'GET /api/favourites': {
        controller: 'FavouriteController',
        action: 'favourites'
    },


    'DELETE /api/favourites/:id': {
        controller: 'FavouriteController',
        action: 'removeFavourite'
    },

    'GET /api/recent_activity/full': {
        controller: 'UserController',
        modelIdentity: 'user',
        action: 'recentActivityFull'
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

    'GET /api/document/get_document/:document_id': {
        controller: 'DocumentController',
        action: 'getDocument',
        pk: 'document_id'
    },

    'GET /api/document/get_document_preview/:document_id': {
        controller: 'DocumentController',
        action: 'getDocumentPreview',
        pk: 'document_id'
    },

    'GET /api/company/:id/document/get_document/:document_id': {
        controller: 'DocumentController',
        action: 'getDocument',
        model: 'company'
    },

    'GET /api/company/:id/document/get_document_preview/:document_id': {
        controller: 'DocumentController',
        action: 'getDocumentPreview',
         model: 'company'
    },

    'GET /api/document': {
        controller: 'DocumentController',
        model: 'document',
        action: 'find'
    },

    'GET /api/document/:document_id': {
        controller: 'DocumentController',
        model: 'document',
        action: 'findOne',
        pk: 'document_id'
    },

    'PUT /api/document/:document_id': {
        controller: 'DocumentController',
        model: 'document',
        action: 'update',
        pk: 'document_id'
    },

    'GET /api/company/:id/document/:document_id': {
        controller: 'DocumentController',
        model: 'company',
        action: 'findOne'
    },

    'PUT /api/company/:id/document/:document_id': {
        controller: 'DocumentController',
        model: 'company',
        action: 'update'
    },

    'POST /api/company/import/validate': {
        controller: 'CompanyController',
        action: 'validate'
    },

    'POST /api/transaction/:type/:id': {
        controller: 'CompanyStateController',
        model: 'company',
        action: 'create',
        method: 'update'
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
        action: 'transactionBulk',
    },

    'GET /api/address/lookup/:query': {
        controller: 'AddressController',
        action: 'lookup'
    },

    'POST /api/company/:id/interests_register/create': {
        controller: 'CompanyStateController',
        action: 'createRegisterEntry',
        model: 'company',
        method: 'update'
    },

    'PUT /api/company/:id/interests_register/remove/:entryId': {
        controller: 'CompanyStateController',
        action: 'deleteRegisterEntry',
        model: 'company'
    },

    'POST /api/company/:id/share_classes/create': {
        controller: 'CompanyStateController',
        action: 'createShareClass',
        model: 'company',
        method: 'update'
    },

    'PUT /api/company/:id/share_classes/:shareClassId': {
        controller: 'CompanyStateController',
        action: 'updateShareClass',
        model: 'company',
        method: 'update'
    },

    'GET /api/company/render/:id/share_register': {
        controller: 'RenderController',
        action: 'renderShareRegister',
        model: 'company'
    },

    'GET /api/company/render/:id/director_register': {
        controller: 'RenderController',
        action: 'renderDirectorRegister',
        model: 'company'
    },

    'GET /api/company/render/:id/annual_return': {
        controller: 'RenderController',
        action: 'renderAnnualReturn',
        model: 'company'
    },

    'POST /api/render_template': {
        controller: 'RenderController',
        action: 'renderTemplate',
        method: 'read'
    },

    'POST /api/send_template': {
        controller: 'RenderController',
        action: 'sendTemplate',
        method: 'read'
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

    'GET /api/company/:id/recent_activity/full': {
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

    'GET /api/company/:id/pending_future': {
        controller: 'CompanyController',
        action: 'GetPendingFutureActions',
        model: 'company'
    },

    'GET /api/company/:id/foreign_permissions': {
        controller: 'CompanyController',
        action: 'getForeignPermissions',
        model: 'company'
    },

    'PUT /api/company/:id/add_permissions': {
        controller: 'CompanyController',
        action: 'addForeignPermissions',
        model: 'company'
    },

    'PUT /api/company/:id/invite_user_with_permission': {
        controller: 'CompanyController',
        action: 'inviteUserWithPermissions',
        model: 'company'
    },

    'PUT /api/company/:id/remove_permissions': {
        controller: 'CompanyController',
        action: 'removeForeignPermissions',
        model: 'company'
    },


    'GET /api/company/permissions/:catalexId': {
        controller: 'CompanyController',
        action: 'companyPermissionsCatalexUser',
    },

    'PUT /api/user/add_permissions': {
        controller: 'UserController',
        action: 'addPermissions'
    },

    'PUT /api/user/remove_permissions': {
        controller: 'UserController',
        action: 'removePermissions'
    },

    'GET /api/documents': {
        controller: 'CompanyController',
        action: 'getDocuments'
    },

    'POST /api/documents': {
        controller: 'CompanyController',
        action: 'createDocument',
        method: 'update'
    },

    'GET /api/company/:id/documents': {
        controller: 'CompanyController',
        action: 'getDocuments',
        model: 'company'
    },

    'POST /api/company/:id/documents': {
        controller: 'CompanyController',
        action: 'createDocument',
        model: 'company',
        method: 'update'
    },

    'POST /api/company/:id/import_pending_history': {
        controller: 'CompanyController',
        action: 'importPendingHistory',
        model: 'company',
        method: 'update'
    },

    'POST /api/company/:id/import_pending_future': {
        controller: 'CompanyController',
        action: 'importPendingFuture',
        model: 'company',
        method: 'update'
    },

    'PUT /api/company/:id/update_pending_history': {
        controller: 'CompanyController',
        action: 'updatePendingHistory',
        model: 'company'
    },

    'PUT /api/company/:id/update_pending_future': {
        controller: 'CompanyController',
        action: 'updatePendingFuture',
        model: 'company'
    },

     'PUT /api/company/:id/reset_pending_history': {
        controller: 'CompanyController',
        action: 'resetPendingHistory',
        model: 'company'
    },

     'PUT /api/company/:id/reparse_reset_pending_history': {
        controller: 'CompanyController',
        action: 'reparseResetPendingHistory',
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

    'GET /api/nzbn/companyDetails': {
        controller: 'ApiCredentialController',
        action: 'companyDetails'
    },

    'POST /api/company/:id/merge_companies_office': {
        controller: 'CompanyController',
        action: 'mergeCompaniesOffice',
        model: 'company'
    },

    'GET /api/company/:id/ar_summary': {
        controller: 'CompanyController',
        action: 'requestARSummary',
        model: 'company'
    },


    'GET /api/bla': {
        controller: 'ApiCredentialController',
        action: 'refreshUserToken'
    }

    'PUT /api/company/:id/update_authority': {
        controller: 'CompanyController',
        action: 'updateUserAuthority',
        model: 'company'
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
