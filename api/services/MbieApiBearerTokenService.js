import Promise from 'bluebird';
import https from 'https';
const curl = Promise.promisifyAll(require('curlrequest'));



function getUserTokenRecord(userId, service) {
    const query = `SELECT "accessToken", "refreshToken", now() < "createdAt" + ( "expiresIn" * interval '1 second') AS valid from api_credential WHERE "ownerId" = :userId AND "service" = :service`;
    const queryOptions = {
        type: sequelize.QueryTypes.SELECT,
        replacements: { userId, service }
    };

    return sequelize.query(query, queryOptions)
        .spread(result => {
            if (!result) {
                throw sails.config.exceptions.UserNotConnected('Current user is not connected to this service', {errorCode: sails.config.enums.USER_NOT_CONNECTED});
            }

            if (!result.valid) {
                return MbieApiBearerTokenService.refreshUserToken(userId, result.refreshToken)

            }

            return result;
        })
}

const TOKEN_WAITING_TIME = 5000;


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
                url: `${sails.config.mbie.nzbn.url}token`,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: UtilService.makeBasicAuthHeader(sails.config.mbie.nzbn.consumerKey, sails.config.mbie.nzbn.consumerSecret)
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
        return getUserTokenRecord(userId, service)
            .then(result => result.accessToken);
    },

    revoke: function(service, token) {
        const config = service === 'nzbn'  ? sails.config.mbie.nzbn : sails.config.mbie.companiesOffice;
        const url = UtilService.buildUrl(`${config.oauth.url}revoke`, {
            token
        });
        let fetchOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': UtilService.makeBasicAuthHeader(config.oauth.consumerKey, config.oauth.consumerSecret)
            }
        };
        // fire and forget
        fetch(url, fetchOptions)
            .catch(() => {}) //swallow
        return Promise.resolve({});
    },

    refreshUserToken: function(userId, refreshToken=null, attemptNumber = 0) {
        const serviceName = 'companies-office';
        // If the user didn't pass the refresh token, go get it
        if (!refreshToken) {
            if(attemptNumber > 5){
                throw Error('Giving up, cannot get refresh token')
            }
            return getUserTokenRecord(userId, serviceName)
                .then(tokenRecord => {
                    const refreshToken = tokenRecord.refreshToken;
                    return MbieApiBearerTokenService.refreshUserToken(userId, refreshToken, attemptNumber+1)
                })
        }

        sails.log.info(`Refreshing ${serviceName} oauth token for user: ${userId}. Using refresh token: ${refreshToken}.`);

        // Build the url for getting the new access token using the refresh token
        const url = UtilService.buildUrl(`${sails.config.mbie.companiesOffice.oauth.url}token`, {
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
            //scope: 'openid'
        });

        let fetchOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': UtilService.makeBasicAuthHeader(sails.config.mbie.companiesOffice.oauth.consumerKey, sails.config.mbie.companiesOffice.oauth.consumerSecret)
            }
        };
        // Companies Office pre-production API has a bad cert - ignore it in development
        if (__DEV__) {
            sails.log.info('Refreshing oauth token using insecure request.');
            fetchOptions.agent = new https.Agent({ rejectUnauthorized: false });
        }
        let oauthResponse, apiCredential;
        // Fetch the new access token
        return sequelize.transaction(() => {
            return Promise.bind({})
            .then(() => fetch(url, fetchOptions))
            .then(response => response.json())
            .then(_oauthResponse => {
                oauthResponse = _oauthResponse;
                if (oauthResponse.error) {
                    // Something wen't wrong - log and throw error
                    const errorDescription = `Error refreshing oauth token for ${serviceName}: ${JSON.stringify(oauthResponse)}`;

                    sails.log.error(errorDescription);
                    sails.log.error(JSON.stringify(url));
                    sails.log.error(JSON.stringify(fetchOptions));
                    throw new Error(errorDescription);
                }
                return ApiCredential.destroy({ where: { refreshToken } })
            })
            .then(() => {
            // Create the new api credentials record with the new access_token, refresh_token, etc.
                return ApiCredential.create({
                    accessToken: oauthResponse.access_token,
                    tokenType: oauthResponse.token_type.toLowerCase(),
                    refreshToken: oauthResponse.refresh_token,
                    expiresIn: oauthResponse.expires_in,
                    service: serviceName,
                    ownerId: userId
                })
            })
            .then(_apiCredential => {
                apiCredential = _apiCredential;
                // Add the scopes to the new record
                const scopes = oauthResponse.scope.split(' ');
                return apiCredential.addScopes(scopes);
            })
            .delay(TOKEN_WAITING_TIME)
            .then(() => {
                sails.log.info(`Finished refreshing oauth token for ${serviceName}`);
                return apiCredential;
            });
        })
    }
}