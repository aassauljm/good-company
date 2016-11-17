/**
 * EventController
 *
 * @description :: Server-side logic for managing models
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
    find: function(req, res) {
        Event.findAll({
            where: {
                userId: req.user.id
            }
        }).then(function(matchingRecords) {
            res.ok(matchingRecords.map(x => x.toJSON()));
        }).catch(function(err) {
            return res.notFound(err);
        });
    }
};
