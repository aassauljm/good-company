/**
 * FavouriteController
 *
 * @description :: Server-side logic for managing roles
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {

    favourites: function(req, res) {
        const favs = () => Favourite.findAll({
            where: {userId: req.user.id},
            include: [
                {
                    model: Company,
                        as: 'company',
                        include: {
                        model: CompanyState,
                        as: 'currentCompanyState'
                    }
                }]
            })
            .then(favourites => {
                console.log(favourites)
                return favourites.map(f => {
                    return {...f.company.toJSON(), favourited: true}
                })
            });

        const fallback = () => Company.findAll({
            where: {ownerId: req.user.id},
            include: {
                model: CompanyState,
                as: 'currentCompanyState'
            },
            limit: 10
        });
        favs()
            .then(items => !items.length ? fallback() : items)
            .then(items => res.json(items))
            .catch(e => res.negotiate(e))
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