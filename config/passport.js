// config/passport.js

var _ = require('lodash');
var _super = require('sails-auth/config/passport');
var passport = require('passport')
var util = require('util')

function OAuth2Strat(){
     passport.Strategy.call(this);
     this.name = 'catalex_oauth2';

     const x = function(){
        const params = {
           // 'code': args.code,
            'grant_type': 'authorization_code',
            'client_id': sails.config.OAUTH_CLIENT_ID,
            'client_secret': sails.config.OAUTH_CLIENT_SECRET,
            'redirect_uri': sails.config.GOOD_COMPANIES_LOGIN_URL
        };
    }

}

OAuth2Strat.prototype.authenticate = function(req, options) {
    console.log(req,  options)
}

util.inherits(OAuth2Strat, strategy);


passport.use(new OAuth2Strat());

_.merge(exports, _super);
_.merge(exports, {
    basic: false,
    local: false
  // Extend with custom logic here by adding additional fields, methods, etc.

});
