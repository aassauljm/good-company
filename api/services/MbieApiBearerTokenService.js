import Promise from 'bluebird';
const curl = Promise.promisifyAll(require('curlrequest'));

let access_token = '64e95988f91a7e32f3832b489ec94041';

module.exports = {
    getToken: function() {
        return MbieApiBearerToken.findAll({
            where: {
                service: 'nzbn',
                createdAt: {
                    $gt: new Date(new Date() - 60 * 60 * 1000) // an hour ago
                }
            }
        })
        .then(result => {
            console.log('dadada');
            return console.log(result);
        });
    },

    requestToken: function() {
        return curl.requestAsync({
                url: 'https://sandbox.api.business.govt.nz/services/token',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: 'Basic WnpHYkpOcHRCNVhxcmVlVHdtaWJFNEt6X3FBYTpSQlF0dFZ1M0c1Z0g3cXpmellVSnA4Z0VmaEVh'
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
                    .then(record => record[0].token);
            });
    }
}
