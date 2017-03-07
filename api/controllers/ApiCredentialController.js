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
        MbieApiBearerTokenService.requestToken()
            .then(r => r.text())
            .then(r => {
                console.log('dadada');
                return console.log(r);
            });

        req.user.getApiCredentials({
                where: { service: 'nzbn' },
                order: [['createdAt', 'DESC']]
            })
            .then(result => result[0] ? result[0].dataValues.accessToken : null)
            .then(nzbnUserAccessToken => {
                if (!nzbnUserAccessToken) {
                    return res.json({message: ['No MBIE access token.']});
                }

                const headers = {
                    Accept: 'application/json',
                    'NZBN-Authorization': 'Bearer ' + nzbnUserAccessToken,
                    Authorization: 'Bearer ' + MbieApiBearerTokenService.getToken()
                };

                return fetch(sails.config.mbie.uri + 'v3/nzbn/users', { headers })
                    .then(response => {
                        if (response.status === 401) {
                            throw new Error('Received 401 from MBIE API');
                        }

                        return response;
                    })
                    .then(response => response.json())
                    .then(users => users.users[0].userId)
                    .then(userNzbnId => fetch(sails.config.mbie.uri + 'v3/nzbn/authorities?user-id=' + userNzbnId, { headers }))
                    .then(response => response.json())
                    .then(json => CompanyInfoService.getCompanyNamesFromNZBNS(json.items))
                    .then(result => res.json(result));
            })
            .catch(error => {
                sails.log.error(error);
                return res.serverError({message: ['Something went wrong.']})
            });
    }

};
