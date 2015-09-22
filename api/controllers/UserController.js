// api/controllers/UserController.js

var _ = require('lodash');
var _super = require('sails-permissions/api/controllers/UserController');

_.merge(exports, _super);
_.merge(exports, {

  // Extend with custom logic here by adding additional fields, methods, etc.

    userInfo: function(req, res){
        User.findOne({id: req.user.id})
        .populate('roles')
        .then(function(r){
            res.json(r);
        })
    }
});
