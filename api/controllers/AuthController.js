// api/controllers/AuthController.js

var _ = require('lodash');
var _super = require('sails-permissions/api/controllers/AuthController');

_.merge(exports, _super);
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
  }
});
