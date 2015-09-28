// api/models/Model.js

var _ = require('lodash');
var _super = require('sails-permissions/api/models/Model');

_.merge(exports, _super);
_.merge(exports, {

  // Extend with custom logic here by adding additional fields, methods, etc.

    attributes: {
        username: {
            type: 'string',
            required: true,
            minLength: 3

        },
        email: {
            type: 'email',
            required: true,
            unique: true
        }
    },
    //model validation messages definitions
    validationMessages: { //hand for i18n & l10n
        email: {
            required: 'Email is required',
            email: 'Provide valid email address',
            unique: 'Email address is already taken'
        },
        username: {
            required: 'Username is required',
            minLength: 'Username is too short'
        }
    }
});
