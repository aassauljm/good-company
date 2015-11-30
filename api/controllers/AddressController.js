/**
 * AddressController
 *
 * @description :: Server-side logic for managing Addresses
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
    lookup: function(req, res){
        res.json({'addresses': [req.params.query]})
    }
};

