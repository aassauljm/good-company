// api/models/Passport.js

var _ = require('lodash');
var _super = require('sails-permissions/api/models/Passport');

var MIN_PASSWORD = 8;

var validatePassword = function(newPassword){
    if(!newPassword || newPassword.length < MIN_PASSWORD){
        throw new sails.config.exceptions.ValidationException("Password must be at least "+MIN_PASSWORD+" characters");
    }
}

_.merge(exports, _super);
_.merge(exports, {

  // Extend with custom logic here by adding additional fields, methods, etc.
  attributes: {
    password: { type: 'string', minLength: 8, required: true },
    changePassword: function(newPassword) {
        validatePassword(newPassword);
        this.password = newPassword;
        return this.save();
    },
  },
  /*  beforeValidate: [function(passport, next){
      passport.identifier = passport.identifier.toLowerCase();
      next();
    }
    ]*/
});
