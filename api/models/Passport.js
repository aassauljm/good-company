// api/models/Passport.js

var _ = require('lodash');
var Promise = require('bluebird');
var bcrypt = Promise.promisifyAll(require('bcryptjs'));
var MIN_PASSWORD = 8;

var validatePassword = function(newPassword) {
    if (!newPassword || newPassword.length < MIN_PASSWORD) {
        throw new sails.config.exceptions.ValidationException("Password must be at least " + MIN_PASSWORD + " characters");
    }
}

function hashPassword(passport) {
    var config = sails.config.auth.bcrypt;
    var salt = config.salt || config.rounds;
    return bcrypt.hashAsync(passport.password, salt)
        .then(function(hash){
            passport.password = hash;
        });
}


module.exports = {

    // Extend with custom logic here by adding additional fields, methods, etc.
    attributes: {
        // Required field: Protocol
        //
        // Defines the protocol to use for the passport. When employing the local
        // strategy, the protocol will be set to 'local'. When using a third-party
        // strategy, the protocol will be set to the standard used by the third-
        // party service (e.g. 'oauth', 'oauth2', 'openid').
        protocol: {
            type: Sequelize.TEXT
        },


        // Provider fields: Provider, identifer and tokens
        //
        // "provider" is the name of the third-party auth service in all lowercase
        // (e.g. 'github', 'facebook') whereas "identifier" is a provider-specific
        // key, typically an ID. These two fields are used as the main means of
        // identifying a passport and tying it to a local user.
        //
        // The "tokens" field is a JSON object used in the case of the OAuth stan-
        // dards. When using OAuth 1.0, a `token` as well as a `tokenSecret` will
        // be issued by the provider. In the case of OAuth 2.0, an `accessToken`
        // and a `refreshToken` will be issued.
        provider: {
            type: Sequelize.TEXT
        }, //UUID4?
        identifier: {
            type: Sequelize.TEXT
        },
        tokens: {
            type: Sequelize.JSON
        },

        password: {
            type: Sequelize.TEXT
        }
    },
    associations: function() {
    },
    options: {
        freezeTableName: false,
        tableName: 'passport',
        classMethods: {},
        instanceMethods: {
            changePassword: function(newPassword) {
                validatePassword(newPassword);
                this.password = newPassword;
                return this.save();
            },
            validatePassword: function(password) {
                return bcrypt.compareAsync(password, this.password)
                    .then(function(success){
                        if(!success){
                            throw new sails.config.exceptions.BadCredentialsException();
                        }
                    });
            }
        },
        hooks: {
            beforeCreate: function(passport) {
                return passport.password && hashPassword(passport);
            },
            beforeValidate: function(passport) {
                if(passport.identifier){
                    passport.identifier = passport.identifier.toLowerCase();
                }
            },
            beforeUpdate: function(passport) {
                return passport.password && hashPassword(passport);
            }
        }
    }
};