import Promise from 'bluebird';
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
        return curl.requestAsync({
                url: `${sails.config.mbie.uri}token`,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: UtilService.makeBasicAuthHeader(sails.config.mbie.consumer_key, sails.config.mbie.consumer_secret)
                },
                data: {
                    grant_type: 'client_credentials'
                }
            })
            .then(result => JSON.parse(result))
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
    }
}
