/**
 * CompanyController
 *
 * @description :: Server-side logic for managing companies
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

function CompanyStateStats(companyState){
    var stats = {};
    return companyState.totalAllocatedShares()
        .then(function(total){
            stats.totalAllocatedShares = total;
            return companyState.totalUnallocatedShares()
        })
        .then(function(total){
            stats.totalUnallocatedShares = total;
            stats.totalShares = stats.totalAllocatedShares + stats.totalUnallocatedShares;
        })
        .then(function(){
            return stats;
        });
}


module.exports = {
    getInfo: function(req, res) {
        Company.findById(req.params.id, {
                include: [{
                    model: CompanyState,
                    as: 'currentCompanyState',
                    include: CompanyState.includes.fullNoJunctions(),
                }],
                order: CompanyState.ordering.full().map((e) => [{model: CompanyState, as: 'currentCompanyState'}, ...e])
            })
            .then(function(company){
                this.company = company;
                return company.currentCompanyState;
            })
            .then(CompanyStateStats)
            .then(function(stats){
                res.json(_.merge({}, this.company.get(), stats))
            });
    },
    history: function(req, res){
        Company.findById(req.params.id)
            .then(function(company){
                return company.getPreviousCompanyState(req.params.generation)
            })
            .then(function(companyState){
                this.companyState = companyState;
                return companyState;
            })
            .then(CompanyStateStats)
            .then(function(stats){
                res.json(_.merge({companyState: this.companyState.get()}, stats))
            })
    }
};