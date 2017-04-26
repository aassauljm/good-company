/**
 * EventController
 *
 * @description :: Server-side logic for managing models
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {


    find: function(req, res) {
        Event.getEvents(req.user.id)
        .then(events => res.json(events))
        .catch(function(err) {
            return res.notFound(err);
        });
    }
};
