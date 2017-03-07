import FormData from 'form-data';

module.exports = {
    getToken: function() {
        MbieApiBearerToken.findAll({
            where: {
                service: 'nzbn',
                createdAt: {
                    $gt: new Date(new Date() - 60 * 60 * 1000) // an hour ago
                }
            }
        })
        .then(result => {
            return console.log(result);
        });

        return '5ac35885a781f8919b6a5f2dfe9234d2';
    },

    requestToken: function() {
        var formData = new FormData();
        formData.append('grant_type', 'client_credentials');

        // console.log(UtilService.makeBasicAuthHeader(sails.config.mbie.consumer_key, sails.config.mbie.consumer_secret));

        return fetch(sails.config.mbie.uri + 'token', {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: UtilService.makeBasicAuthHeader(sails.config.mbie.consumer_key, sails.config.mbie.consumer_secret)
            },
            body: formData
        });
    }
}
