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
        req.user.getApiCredentials({
                where: { service: 'nzbn' },
                order: [['createdAt', 'DESC']]
            })
            .then(result => result[0] ? result[0].dataValues.accessToken : null)
            .then(nzbnUserAccessToken => {
                if (!nzbnUserAccessToken) {
                    throw new Error('No MBIE access token');
                }

                return nzbnUserAccessToken;
            })
            .then(nzbnUserAccessToken => {
                return MbieApiBearerTokenService.getToken()
                    .then(mbieBearerToken => {
                        if (!mbieBearerToken) {
                            return MbieApiBearerTokenService.requestToken();
                        }
                        return mbieBearerToken;
                    })
                    .then(mbieBearerToken => ({
                            Accept: 'application/json',
                            'NZBN-Authorization': 'Bearer ' + nzbnUserAccessToken,
                            Authorization: 'Bearer ' + mbieBearerToken
                    }));
            })
            .then(headers => {
                const url = sails.config.mbie.uri + 'v3/nzbn/users';
                sails.log.info(`Requesting from MBIE ${url}  ${JSON.stringify(headers)}`)
                return fetch(url, { headers })
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
                return res.json({message: ['Something went wrong.']});
            });
    }

};
