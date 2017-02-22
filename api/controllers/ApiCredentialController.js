import fetch from "isomorphic-fetch";

/**
 * ApiCredential
 *
 * @description :: Get OAuth tokens from third parties
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

function buildUri(baseUri, parameters={}) {
    // Build the parameters list
    let queryString = Object.keys(parameters).reduce((acc, key) => {
        const parameter = encodeURIComponent(parameters[key]);
        const queryValue = key + '=' + parameter + '&';

        return acc + queryValue;
    }, '?');

    // Remove the final '&' or '?' added by adding the parameters
    queryString = queryString.slice(0, -1);

    // Return the base uri plus the query string
    return baseUri + queryString;
}

module.exports = {

    nzbn: function(req, res) {
        if (req.query.code) {
            const code = req.query.code;

            const baseUri = 'https://www.eat.nzbn.govt.nz/oauth-service/oauth/token';

            const clientId = 'NZBN-Catalex-Test';

            const uri = buildUri(baseUri, {
                code,
                grant_type: 'authorization_code',
                client_id: clientId,
                scopes: 'updateNZBNPBD',
                redirectUri: sails.config.APP_URL + '/companies_office_cb'
            });

            res.json(new Buffer(basicUser + ':' + basicPass, 'base64').toString());

            const basicUser = 'NZBN-Catalex-Test';
            const basicPass = 'bHDrK2fsBVjHkhHh';

            fetch(uri, {
                method: 'POST',
                header: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic ' + new Buffer(basicUser + ':' + basicPass, 'base64').toString()
                }
            }).then(response => {
                res.json(response);
            });
        }
        else if (req.query.access_token) {
            res.end('token');
        }
        else {
            const baseUri = 'https://www.eat.nzbn.govt.nz/oauth-service/oauth/authorize';

            const url = buildUri(baseUri, {
                client_id: 'NZBN-Catalex-Test',
                redirect_uri: sails.config.APP_URL + '/companies_office_cb',
                response_type: 'code'
            });

            res.redirect(url);
        }
    }

};
