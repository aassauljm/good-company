import Promise from 'bluebird';
const curl = Promise.promisifyAll(require('curlrequest'));

module.exports = {
    getToken: function() {
        return MbieApiBearerToken.findAll({
            where: {
                service: 'nzbn',
                createdAt: {
                    $gt: new Date(new Date() - 60 * 60 * 1000) // an hour ago
                }
            },
            order: [['createdAt', 'DESC']]
        })
        .spread(result => result ? result.dataValues.token : null);
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
