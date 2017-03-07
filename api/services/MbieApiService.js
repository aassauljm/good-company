/**
 * Take a base URI and an object of parameters.
 * Return a URI with the base URI and all the parameters form the object.
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

export function authWith(req, res) {
    const service = req.params.service;

    switch (service) {
        case 'nzbn':
            nzbn(req, res);
            break;
        default:
            throw new Error("MBIE auth service '${service}' not found");
    }
}

function nzbn(req, res) {
    const service = 'nzbn';
    const callbackRoute = '/companies_office_cb'; // '/api/auth-with/' + service;

    if (req.query.code) {
        const code = req.query.code;

        const uri = buildUri(sails.config.mbie.oauthURI + 'token', {
            code,
            grant_type: 'authorization_code',
            client_id: sails.config.mbie.nzbn.clientId,
            scopes: 'updateNZBNPBD',
            redirect_uri: sails.config.APP_URL + callbackRoute
        });

        fetch(uri, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': UtilService.makeBasicAuthHeader(sails.config.mbie.nzbn.basicAuthUser, sails.config.mbie.nzbn.basicAuthPass)
                }
            })
            .then(response => {
                return response.text()
            })
            .then(result => {

                console.log('error');
                console.log(result);

                const authDetails = JSON.parse(result);
                sails.log.info(authDetails);
                const data = {
                    accessToken: authDetails.access_token,
                    tokenType: authDetails.token_type,
                    refreshToken: authDetails.refresh_token,
                    expiresIn: authDetails.expires_in,
                    service: service,
                    ownerId: req.user.id
                };

                return ApiCredential.create(data)
                    .then(apiCredential => {
                        const scopes = authDetails.scope.split(' ');
                        apiCredential.addScopes(scopes);
                    });
            })
            .then(() => {
               res.redirect('/import/nzbn');
            })
            .catch(e => {
                sails.log.error(e)
                res.serverError();
            })
    }
    else if (req.query.error) {
        res.json({message: [req.query.error]});
    }
    else {
        const url = buildUri(sails.config.mbie.oauthURI + 'authorize', {
            client_id: sails.config.mbie.nzbn.clientId,
            redirect_uri: sails.config.APP_URL + callbackRoute,
            response_type: 'code'
        });

        res.redirect(url);
    }
}
