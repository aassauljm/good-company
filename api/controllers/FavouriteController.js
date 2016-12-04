/**
 * FavouriteController
 *
 * @description :: Server-side logic for managing roles
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {

    favourites: function(req, res) {
         return sequelize.query("select user_favourites_now(:id)",
                       { type: sequelize.QueryTypes.SELECT,
                        replacements: { id: req.user.id}})
                    .map(r => r.user_favourites_now)
                    .then(results => {
                        res.json(results);
                    })
                    .catch((e) => {
                        res.serverError(e)
                    })
    },

    addFavourite: function(req, res) {
        const args = {userId: req.user.id, companyId: req.params.companyId};
        Favourite.findOrCreate({where: args, defaults: args})
            .then(() => res.ok({message: 'Company added to favourites'}))
    },

    removeFavourite: function(req, res) {
        const args = {userId: req.user.id, companyId: req.params.companyId};
        Favourite.destroy({where: args})
            .then(() => res.ok({message: 'Company removed from favourites'}))
    }

};