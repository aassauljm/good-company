// api/controllers/AuthController.js

const _ = require('lodash');
const _super = require('sails-auth/api/controllers/AuthController');
const actionUtil = require('sails-hook-sequelize-blueprints/actionUtil');
const fetch = require("isomorphic-fetch");
const querystring = require('querystring');

//_.merge(exports, _super);
_.merge(exports, {

  // Extend with custom logic here by adding additional fields, methods, etc.
  logout: function (req, res) {
    req.logout();
    delete req.user;
    delete req.session.passport;
    // TESTING FOUND A PROBLEM WITH THIS NOT BEING SET
    req.session.authenticated = false;

    if (!req.isSocket) {
        res.redirect(req.query.next || '/');
    }
    else {
        res.ok();
    }
},

catalexLogin: function(req, res) {
    const args = actionUtil.parseValues(req);
    const params = {
        'code': args.code,
        'grant_type': 'authorization_code',
        'client_id': sails.config.OAUTH_CLIENT_ID,
        'client_secret': sails.config.OAUTH_CLIENT_SECRET,
        'redirect_uri': sails.config.GOOD_COMPANIES_LOGIN_URL
    };
    const query = querystring.stringify(params);

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
        return fetch(sails.config.USER_RESOURCE_URL, querystring.stringify({'access_token': data['access_token']}))
    })
    .then(response => {
        return response.json();
    })
    .catch((e) => {
        console.log(e)
        return res.negotiate(e);
    })
}
});