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

var simpleAuth = [
    'passport',
    'sessionAuth',
    'AuditPolicy'
];

var noCriteria = [
    'passport',
    'sessionAuth',
    'ModelPolicy',
    'AuditPolicy',
    'OwnerPolicy',
    'PermissionPolicy'
]

module.exports.policies = {
    LandingController: {
        'landing': ['passport']
    },

    '*': [
        'passport',
        'sessionAuth',
        'ModelPolicy',
        'AuditPolicy',
        'OwnerPolicy',
        'PermissionPolicy',
        'CriteriaPolicy'
    ],
    AuthController: {
        '*': ['passport'],
        'callback': [
            'WaitForRequestLogPolicy',
            'AuditPolicy',
            'passport'
        ]
    },
    UserController: {
        'setPassword': simpleAuth,
        'signup': true,
        'validateUser': true,
        'pendingJobs': simpleAuth
    },
    ModelController:{
        'create': false,
        'update': false,
        'destroy': false
    },
    DocumentController: {
        'delete': false,
        //'*': false,
        /*'find': ['passport','sessionAuth', 'OwnerPolicy'],
        'findOne': ['passport','sessionAuth', 'OwnerPolicy'],
        'delete':  ['passport','sessionAuth', 'OwnerPolicy'],
        'update':  ['passport','sessionAuth', 'OwnerPolicy'],
        'uploadDocument': ['passport','sessionAuth'],
        'getDocument': ['passport','sessionAuth', 'OwnerPolicy'],
        'getDocumentPreview': ['passport','sessionAuth', 'OwnerPolicy'],*/
    },
    CompanyController: {
        'populate': false,
        'lookup': simpleAuth,
        'lookupOwn': simpleAuth,
        'find': simpleAuth
    },
    FavouriteController: {
        '*': simpleAuth
    },
    RenderController: {
        renderTemplate: simpleAuth,
        echo: ['passport','sessionAuth']
    },
    EventController: {
        'find': noCriteria
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