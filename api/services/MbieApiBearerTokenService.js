import Promise from 'bluebird';
import https from 'https';
const curl = Promise.promisifyAll(require('curlrequest'));

module.exports = {
    getToken: function() {
        const query = `SELECT * from mbie_api_bearer_token WHERE service = 'nzbn' AND  now() < "createdAt" + ( "expiresIn" * interval '1 second')`;

        return sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .spread(result => result ? result.token : null)
            .then(mbieBearerToken => {
                if (!mbieBearerToken) {
                    return MbieApiBearerTokenService.requestToken();
                }
                return mbieBearerToken;
            });
    },

    requestToken: function() {
        // using curl for some reason, please record why here
        return curl.requestAsync({
                url: `${sails.config.mbie.uri}token`,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: UtilService.makeBasicAuthHeader(sails.config.mbie.nzbn.consumer_key, sails.config.mbie.nzbn.consumer_secret)
                },
                data: {
                    grant_type: 'client_credentials'
                }
            })
            .then(JSON.parse)
            .then(json => {
                const defaults = {
                    token: json.access_token,
                    expiresIn: json.expires_in,
                    service: 'nzbn'
                };

                return MbieApiBearerToken.findOrCreate({
                        where: {
                            token: defaults.token,
                            service: defaults.service
                        },
                        defaults
                    })
                    .spread(record => record.token);
            });
    },


    getUserToken: function(userId, service) {
        const query = `SELECT "accessToken", "refreshToken", now() < "createdAt" + ( "expiresIn" * interval '1 second') AS valid from api_credential WHERE "ownerId" = :userId AND "service" = :service`;
        const queryOptions = {
            type: sequelize.QueryTypes.SELECT,
            replacements: { userId, service }
        };

        return sequelize.query(query, queryOptions)
            .spread(result => {
                if (!result.valid) {
                    return MbieApiBearerTokenService.refreshUserToken(result.refreshToken);
                }

                return result.accessToken;
            })
    },

    refreshUserToken: function(refreshToken, userId) {
        const serviceName = 'companies-office';

        const url = UtilService.buildUrl(`${sails.config.mbie.companiesOffice.oauth.url}token`, {
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
            scope: 'openid'
        });

        let fetchOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': UtilService.makeBasicAuthHeader(sails.config.mbie.companiesOffice.oauth.consumer_key, sails.config.mbie.companiesOffice.oauth.consumer_secret)
            }
        };

        if (__DEV__) {
            fetchOptions.agent = new https.Agent({
                rejectUnauthorized: false
            });
        }

        return fetch(url, fetchOptions)
            .then(response => response.json())
            .then(oauthResponse => {
                return ApiCredential.destroy({
                        where: {
                            serviceName: service,
                            ownerId: iserId
                        }
                    })
                    .then(() => {
                        const data = {
                            accessToken: oauthResponse.access_token,
                            tokenType: oauthResponse.token_type.toLowerCase(),
                            refreshToken: oauthResponse.refresh_token,
                            expiresIn: oauthResponse.expires_in,
                            service: serviceName,
                            ownerId: userId
                        };

                        return ApiCredential.create(data)
                    })
                    .then(apiCredential => {
                        const scopes = oauthResponse.scope.split(' ');
                        apiCredential.addScopes(scopes);

                        return result.access_token;
                    });
            })
    }
}