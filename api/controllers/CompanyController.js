/**
 * CompanyController
 *
 * @description :: Server-side logic for managing companies
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
    getInfo: function(req, res) {
        Company.findById(req.params.id, {
                include: [{
                    model: Transaction,
                    as: 'currentTransaction',
                    include: [{
                        model: Shareholding,
                        as: 'shareholdings',
                        include: [{
                            model: Parcel,
                            as: 'parcels',
                            order: ['shareClass', 'DESC']
                        }, {
                            model: Shareholder,
                            as: 'shareholders',
                            order: ['name', 'DESC']
                        }]
                    }]
                }]
            })
            .then(function(company) {
                this.company = company.get();
                return company.currentTransaction.totalShares()
            })
            .then(function(total){
                this.company.totalAllocatedShares = total;
                res.json(this.company)
            });
    }
};