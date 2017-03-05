import fetch from "isomorphic-fetch";

/**
 * ApiCredential
 *
 * @description :: Get OAuth tokens from third parties
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {

    mbie: function (req, res) {
        MbieApiService.authWith(req, res);
    },

    companies_office_cb: function (req, res) {
        req.params.service = 'nzbn';
        MbieApiService.authWith(req, res);
    },

    authorisedCompanies: function (req, res) {
        fetch('https://sandbox.api.business.govt.nz/services/v3/nzbn/users', {
                headers: {
                    Accept: 'application/json',
                    'NZBN-Authorization': 'Bearer d3f7b60c-f687-4291-92ed-18a3fe0c278f',
                    Authorization: 'Bearer 09cd500d647a54069ad85cc6b23b019a'
                }
            })
            .then(response => {
                return response.text();
            })
            .then(users => {
                users = JSON.parse(users);
                // This call returns the current user. There will always be one and only one user - therefore, let's take the first item in the users array
                const userNzbnId = users[0].userId;
                res.json(userNzbnId);
            });
    }

};
