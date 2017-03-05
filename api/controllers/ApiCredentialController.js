import fetch from "isomorphic-fetch";

/**
 * ApiCredential
 *
 * @description :: Get OAuth tokens from third parties
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

const nzbnServiceToken = '9f107b532c6b0869e2dd74876ff3a001';

function getUserMbieAccessToken(user) {
    return user.getApiCredentials({
        where: {
            service: 'nzbn'
        },
        order: [
            ['createdAt', 'DESC']
        ]
    })
    .then(result => result ? result[0].dataValues.accessToken : null);
}

module.exports = {

    mbie: function (req, res) {
        MbieApiService.authWith(req, res);
    },

    companies_office_cb: function (req, res) {
        req.params.service = 'nzbn';
        MbieApiService.authWith(req, res);
    },

    authorisedCompanies: function (req, res) {
        getUserMbieAccessToken(req.user)
            .then(nzbnUserAccessToken => {
                if (!nzbnUserAccessToken) {
                    return res.json({message: ['No MBIE access token']});
                }

                const headers = {
                    Accept: 'application/json',
                    'NZBN-Authorization': 'Bearer ' + nzbnUserAccessToken,
                    Authorization: 'Bearer ' + nzbnServiceToken
                };

                return fetch('https://sandbox.api.business.govt.nz/services/v3/nzbn/users', {headers})
                    .then(response => response.json())
                    .then(users => users.users[0].userId)
                    .then(userNzbnId => {
                        return fetch('https://sandbox.api.business.govt.nz/services/v3/nzbn/authorities?user-id=' + userNzbnId, {
                            headers: {
                                Accept: 'application/json',
                                'NZBN-Authorization': 'Bearer ' + nzbnUserAccessToken,
                                Authorization: 'Bearer ' + nzbnServiceToken
                            }
                        });
                    })
                    .then(response => response.json())
                    .then(result => {
                        return res.json(result.items);
                    });
            })
    }

};
