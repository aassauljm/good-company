/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your controllers.
 * You can apply one or more policies to a given controller, or protect
 * its actions individually.
 *
 * Any policy file (e.g. `api/policies/authenticated.js`) can be accessed
 * below by its filename, minus the extension, (e.g. "authenticated")
 *
 * For more information on how policies work, see:
 * http://sailsjs.org/#!/documentation/concepts/Policies
 *
 * For more information on configuring policies, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.policies.html
 */


var standardAuth = [
    'passport',
    'sessionAuth',
    'ModelPolicy',
    'AuditPolicy',
    'OwnerPolicy',
    'ACLPolicy'
];

var simpleAuth = [
    'passport',
    'sessionAuth',
    'AuditPolicy'
];


module.exports.policies = {
    LandingController: {
        'landing': ['passport']
    },

    '*': standardAuth,
    AuthController: {
        '*': ['passport'],
        'callback': [
            'WaitForRequestLogPolicy',
            'AuditPolicy',
            'passport'
        ]
    },
    UserController: {
        validateUser: true,
        userInfo: simpleAuth,
        pendingJobs: simpleAuth,
        recentActivity: simpleAuth,
        recentActivityFull: simpleAuth,
        alerts: simpleAuth,
        accountSettings: simpleAuth,
        addPermissions: simpleAuth,
        removePermissions: simpleAuth,
        lookupAddress: simpleAuth,
        refreshUser: simpleAuth
    },
    ModelController:{
        'create': false,
        'update': false,
        'destroy': false
    },
    CompanyController: {
        'populate': false,
        'lookup': simpleAuth,
        'lookupOwn': simpleAuth,
        'findPerson': simpleAuth,
        'find': simpleAuth,
        'companyPermissionsCatalexUser': simpleAuth,
        'updateCompanyPermissionsCatalexUser': simpleAuth
    },
    CompanyStateController: {
        'create': standardAuth.concat(['SuspendedPolicy']),
    },
    FavouriteController: {
        '*': simpleAuth,
        'addFavourite': standardAuth
    },
    RenderController: {
        renderTemplate: simpleAuth,
        sendTemplate: simpleAuth,
        echo: ['passport','sessionAuth']
    },
    EventController: {
        'find': simpleAuth
    },

    AdminController: {
        '*': 'adminPolicy'
    },
    ApiCredentialController: {
        '*': simpleAuth
    }

    /***************************************************************************
     *                                                                          *
     * Default policy for all controllers and actions (`true` allows public     *
     * access)                                                                  *
     *                                                                          *
     ***************************************************************************/

    // '*': true,

    /***************************************************************************
     *                                                                          *
     * Here's an example of mapping some policies to run before a controller    *
     * and its actions                                                          *
     *                                                                          *
     ***************************************************************************/
    // RabbitController: {

    // Apply the `false` policy as the default for all of RabbitController's actions
    // (`false` prevents all access, which ensures that nothing bad happens to our rabbits)
    // '*': false,

    // For the action `nurture`, apply the 'isRabbitMother' policy
    // (this overrides `false` above)
    // nurture  : 'isRabbitMother',

    // Apply the `isNiceToAnimals` AND `hasRabbitFood` policies
    // before letting any users feed our rabbits
    // feed : ['isNiceToAnimals', 'hasRabbitFood']
    // }
};
