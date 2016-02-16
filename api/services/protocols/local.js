// api/services/protocols/local.js

var _ = require('lodash');
var Promise = require('bluebird');

var SAError = require('sails-auth/lib/error/SAError.js');
/**
 * Local Authentication Protocol
 *
 * The most widely used way for websites to authenticate users is via a username
 * and/or email as well as a password. This module provides functions both for
 * registering entirely new users, assigning passwords to already registered
 * users and validating login requesting.
 *
 * For more information on local authentication in Passport.js, check out:
 * http://passportjs.org/guide/username-password/
 */

/**
 * @param {Object}   req
 * @param {Object}   res
 * @param {Function} next
 */
exports.register = function(user) {
    return exports.createUser(user)
};

/**
 * Register a new user
 *
 * This method creates a new user from a specified email, username and password
 * and assign the newly created user a local Passport.
 *
 * @param {String}   username
 * @param {String}   email
 * @param {String}   password
 * @param {Function} next
 */
exports.createUser = function(_user) {
    var password = _user.password;
    var user;
    delete _user.password;
    return sequelize.transaction(function(t) {
        return User.create(_user, {transaction: t})
            .then(function(__user) {
                user = __user;
                if(_user.roles)
                    return Promise.all(_user.roles.map(function(role){ return user.addRole(role, {transaction: t}); }))
            })
            .then(function(){
                return sails.models.passport.create({
                    protocol: 'local',
                    password: password,
                    userId: user.id
                }, {transaction: t})
            })
            .then(function(){
                return user;
            })
        })
        .catch(function(err) {
            throw new sails.config.exceptions.ValidationError(err.message);
        })
};
/**
 * Assign local Passport to user
 *
 * This function can be used to assign a local Passport to a user who doens't
 * have one already. This would be the case if the user registered using a
 * third-party service and therefore never set a password.
 *
 * @param {Object}   req
 * @param {Object}   res
 * @param {Function} next
 */
exports.connect = function(req, res, next) {
    var user = req.user,
        password = req.param('password'),
        Passport = sails.models.passport;

    return Passport.findOne({
            where: {
                protocol: 'local',
                user: user.id
            }
        })
        .catch(function() {
            return Passport.create({
                protocol: 'local',
                password: password,
                user: user.id

            })
        })
        .then(function() {
            next(user);
        });
};

/**
 * Validate a login request
 *
 * Looks up a user using the supplied identifier (email or username) and then
 * attempts to find a local Passport associated with the user. If a Passport is
 * found, its password is checked against the password supplied in the form.
 *
 * @param {Object}   req
 * @param {string}   identifier
 * @param {string}   password
 * @param {Function} next
 */
exports.login = function(req, identifier, password, next) {
    var isEmail = validateEmail(identifier),
        query = {},
        user, passport;

    if (isEmail) {
        query.email = identifier;
    } else {
        query.username = identifier;
    }
    sails.models.user.findOne({where: query})
        .then(function(_user) {
            user = _user;
            if(!user){
                throw new sails.config.exceptions.UserNotFoundException()
            }
            return sails.models.passport.findOne({
                where: {
                protocol: 'local',
                userId: user.id
                }
            });
        })
        .then(function(_passport) {
            passport = _passport;
            if(!passport){
                throw new sails.config.exceptions.BadCredentialsException();
            }
            return passport.validatePassword(password)
        })
        .then(function() {
            next(null, user, passport);
        })
        .catch(sails.config.exceptions.BadCredentialsException, function() {
            req.flash('error', 'Error.Passport.Password.Wrong');
            return next(null, false);
        })
        .catch(function(e) {
            if (isEmail) {
                req.flash('error', 'Error.Passport.Email.NotFound');
            } else {
                req.flash('error', 'Error.Passport.Username.NotFound');
            }
            return next(null, false);
        });
}


/*
          if (err) {
            return next(err);
          }

          if (!res) {
            req.flash('error', 'Error.Passport.Password.Wrong');
            return next(null, false);
          } else {
            return next(null, user, passport);
          }
        });

      else {
        req.flash('error', 'Error.Passport.Password.NotSet');
        return next(null, false);
      }
    })
*/


var EMAIL_REGEX = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;

/**
 * Use validator module isEmail function
 *
 * @see <https://github.com/chriso/validator.js/blob/3.18.0/validator.js#L38>
 * @see <https://github.com/chriso/validator.js/blob/3.18.0/validator.js#L141-L143>
 */
function validateEmail(str) {
    return EMAIL_REGEX.test(str);
}