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

const authWithNzbn = (req, res) => {
    const service = 'nzbn';
    const callbackRoute = `/api/auth-with/${service}`;

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

const removeNzbnAuth = (req, res) => {
    ApiCredential.destroy({
        where: {
            service: req.params.service,
            ownerId: req.user.id
        }
    })
    .then(result => {
        if (result === 0) {
            return res.json({message: ['No existing RealMe connection']});
        }

        return res.json({message: ['RealMe disconnected']});
    });
}

const nzbn = {
    authWith: authWithNzbn,
    removeAuth: removeNzbnAuth
}

function getService(service) {
    switch (service) {
        case 'nzbn':
            return nzbn;
        default:
            throw new Error("MBIE auth service '${service}' not found");
    }
}

export function authWith(req, res) {
    const service = getService(req.params.service);
    service.authWith(req, res);
}

export function removeAuth(req, res) {
    const service = getService(req.params.service);
    service.removeAuth(req, res);
}
