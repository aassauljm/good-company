import fetch from "isomorphic-fetch";
import FormData from 'form-data';

/**
 * ApiCredential
 *
 * @description :: Get OAuth tokens from third parties
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

const nzbnServiceToken = 'ad4c469b77c34c4ee2c27db75a38d624';

// function getNzbnServiceToken() {
//     curl -k --user "ZzGbJNptB5XqreeTwmibE4Kz_qAa:RBQttVu3G5gH7qzfzYUJp8gEfhEa"

//     var formData = new FormData();
//     formData.append('grant_type', 'client_credentials');

//     return fetch('https://sandbox.api.business.govt.nz/services/token', {
//         headers: {
//             'Content-Type': 'application/x-www-form-urlencoded'
//         },
//         body: form
//     })
// }

module.exports = {

    mbie: function (req, res) {
        MbieApiService.authWith(req, res);
    },

    companies_office_cb: function (req, res) {
        req.params.service = 'nzbn';
        MbieApiService.authWith(req, res);
    },

    authorisedCompanies: function (req, res) {
        req.user.getApiCredentials({
                where: { service: 'nzbn' },
                order: [['createdAt', 'DESC']]
            })
            .then(result => result ? result[0].dataValues.accessToken : null)
            .then(nzbnUserAccessToken => {
                if (!nzbnUserAccessToken) {
                    return res.json({message: ['No MBIE access token']});
                }

                const headers = {
                    Accept: 'application/json',
                    'NZBN-Authorization': 'Bearer ' + nzbnUserAccessToken,
                    Authorization: 'Bearer ' + nzbnServiceToken
                };

                return fetch('https://sandbox.api.business.govt.nz/services/v3/nzbn/users', { headers })
                    .then(response => response.json())
                    .then(users => users.users[0].userId)
                    .then(userNzbnId => fetch('https://sandbox.api.business.govt.nz/services/v3/nzbn/authorities?user-id=' + userNzbnId, { headers }))
                    .then(response => response.json())
                    .then(result => {
                        return res.json(result.items);
                    });
            })
    }

};
