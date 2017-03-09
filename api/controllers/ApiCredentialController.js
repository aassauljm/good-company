import fetch from "isomorphic-fetch";
import Promise from 'bluebird';
import promiseRetry from 'bluebird-retry';

/**
 * ApiCredential
 *
 * @description :: Get OAuth tokens from third parties
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
function getUserNzbnToken(user) {
    return user.getApiCredentials({
            where: { service: 'nzbn' },
            order: [['createdAt', 'DESC']]
        })
        .then(result => result[0] ? result[0].dataValues.accessToken : null)
        .then(nzbnUserAccessToken => {
            if (!nzbnUserAccessToken) {
                throw new Error('No MBIE access token');
            }

            return nzbnUserAccessToken;
        });
}

function getAuthorisedCompanies(user) {
    let headers;

    return getUserNzbnToken(user)
            .then(nzbnUserAccessToken => {
                return MbieApiBearerTokenService.getToken()
                    .then(mbieBearerToken => ({
                            Accept: 'application/json',
                            'NZBN-Authorization': 'Bearer ' + nzbnUserAccessToken,
                            Authorization: 'Bearer ' + mbieBearerToken
                        }));
            })
            .then(_headers => {
                headers = _headers;
                const url = sails.config.mbie.uri + 'v3/nzbn/users';

                sails.log.info(`Requesting from MBIE ${url}  ${JSON.stringify(headers)}`);

                return fetch(url, { headers: headers });
            })
            .then(response => {
                if (response.status === 401) {
                    throw new Error('Received 401 from MBIE API');
                }
                return response;
            })
            .then(response => response.json())
            .then(users => {
                return users.users[0].userId;
            })
            .then(userNzbnId => fetch(sails.config.mbie.uri + 'v3/nzbn/authorities?user-id=' + userNzbnId, { headers: headers }))
            .then(response => response.json())
            .then(json => CompanyInfoService.getCompanyNamesFromNZBNS(json.items))
}

module.exports = {

    mbie: function (req, res) {
        MbieApiService.authWith(req, res);
    },

    removeAuth: function(req, res) {
        MbieApiService.removeAuth(req, res);
    },

    companies_office_cb: function (req, res) {
        req.params.service = 'nzbn';
        MbieApiService.authWith(req, res);
    },

    authorisedCompanies: function (req, res) {
        function getCompaniesTask() {
             return getAuthorisedCompanies(req.user)
                .then(authorisedCompanies => Promise.resolve(authorisedCompanies))
                .catch(error => Promise.reject(error));
        }

        promiseRetry(getCompaniesTask, { max_tries: 5, interval: 1000, backoff: 1.5 })
            .then(authorisedCompanies => res.json(authorisedCompanies))
            .caught(error => {
                sails.log.error(error);
                res.serverError(error);
            });
    },

    companyDetails: function (req, res) {
        MbieApiService.lookupByNzbn(req.query.nzbn)
            .then(result => res.json(result))
            .catch(error => {
                sails.log.error(error);
                res.serverError(error);
            });
    }

};
