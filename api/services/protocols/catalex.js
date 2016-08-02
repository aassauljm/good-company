// api/services/protocols/oauth2.js

var _ = require('lodash');


module.exports = function (req, profile, next) {
      sails.log.info('User found', profile);
      var query = {
        identifier: profile.id.toString(),
        protocol: 'oauth2',
        //tokens: { accessToken: accessToken }
      };

      /*if (!_.isUndefined(refreshToken)) {
        query.tokens.refreshToken = refreshToken;
      }*/
    profile.username = profile.name;
    return sails.services.passport.connect(req, query, profile, next);
}
