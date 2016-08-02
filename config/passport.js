// config/passport.js

var _ = require('lodash');
var passport = require('passport')
var util = require('util')
const actionUtil = require('sails-hook-sequelize-blueprints/actionUtil');
const fetch = require("isomorphic-fetch");
const querystring = require('querystring');
const Strategy = require('passport-strategy').Strategy


function OAuth2Strat(options, protocol){
     passport.Strategy.call(this);
     this.name = 'catalex';
     this._options = options;
     this._protocol = protocol;
     passport.Strategy.call(this);
}

util.inherits(OAuth2Strat, Strategy);

OAuth2Strat.prototype.authenticate = function(req, options) {
    var self = this;
    const args = actionUtil.parseValues(req);
    const params = {
        'code': args.code,
        'grant_type': 'authorization_code',
        'client_id': sails.config.OAUTH_CLIENT_ID,
        'client_secret': sails.config.OAUTH_CLIENT_SECRET,
        'redirect_uri': sails.config.GOOD_COMPANIES_LOGIN_URL
    };
    sails.log.info(params);
    let query = querystring.stringify(params);

    fetch(sails.config.OAUTH_ACCESS_TOKEN_URL, {
        method: 'POST',
        body: query,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(query)
        }
    })
    .then(response => {
        return response.json();
    })
    .then(data => {
        query = querystring.stringify({'access_token': data['access_token']});
        sails.log.info('Getting token:', sails.config.USER_RESOURCE_URL + '?' + query);
        return fetch(sails.config.USER_RESOURCE_URL + '?' + query);
    })
    .then(response => {
        return response.json();
    })
    .then(user => {
        return self._protocol(req, user, function(err, user) {
            self.success(user, {})
        })
        //self.success(user, {});
    })
    .catch((e) => {
        console.log('failing', e)
        return self.fail(e);
    });
}

//util.inherits(OAuth2Strat, strategy);

module.exports.passport =  {
    catalex: {
        strategy: OAuth2Strat,
        protocol: 'catalex'
    }
  // Extend with custom logic here by adding additional fields, methods, etc.
};
