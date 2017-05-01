import https from 'https';
import fetch from "isomorphic-fetch";

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

function generateUrlForOauthLogin(url, clientId, callbackRoute, extraQueryParameters) {
    const queryParameters = {
        client_id: clientId,
        redirect_uri: sails.config.APP_URL + callbackRoute,
        response_type: 'code',
        ...extraQueryParameters
    }

    return buildUri(url, queryParameters);
}

function requestOauthToken({oauthRoute, callbackRoute, code, clientId, consumerKey, consumerSecret, serviceName, userId}) {
    const url = buildUri(oauthRoute, {
        code: code,
        grant_type: 'authorization_code',
        client_id: clientId,
        redirect_uri: sails.config.APP_URL + callbackRoute
    });

    let tokenRequestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': UtilService.makeBasicAuthHeader(consumerKey, consumerSecret)
        }
    };

    if (__DEV__) {
        tokenRequestOptions.agent = new https.Agent({
            rejectUnauthorized: false
        });
    }

    return fetch(url, tokenRequestOptions)
        .then(response => response.json())
        .then(oauthResponse => {
            console.log('dadada');
            console.log(oauthResponse);

            if (oauthResponse.error) {
                throw new Error(oauthResponse);
            }

            // Add token to database
            const data = {
                accessToken: oauthResponse.access_token,
                tokenType: oauthResponse.token_type,
                refreshToken: oauthResponse.refresh_token,
                expiresIn: oauthResponse.expires_in,
                service: serviceName,
                ownerId: userId
            };

            return ApiCredential.create(data)
                .then(apiCredential => {
                    const scopes = oauthResponse.scope.split(' ');
                    apiCredential.addScopes(scopes);
                })
        });
}

function authWithNzbn(req, res) {
    const service = 'nzbn';
    const callbackRoute = `/api/auth-with/${service}`;

    if (req.query.code) {
        requestOauthToken({
                oauthRoute: sails.config.mbie.oauthURI + 'token',
                callbackRoute,
                code: req.query.code,
                clientId: sails.config.mbie.nzbn.clientId,
                consumerKey: sails.config.mbie.nzbn.basicAuthUser,
                consumerSecret: sails.config.mbie.nzbn.basicAuthPass,
                serviceName: service,
                userId: req.user.id
            })
            .then(() => res.redirect('/import/nzbn'))
            .catch((error) => {
                sails.log.error(error);
                res.json({message: ['Something went wrong']});
            });
    }
    else if (req.query.error) {
        sails.log.error(req.query.error)
        res.redirect('/');
    }
    else {
        const redirectUrl = generateUrlForOauthLogin(
            sails.config.mbie.oauthURI + 'authorize',
            sails.config.mbie.nzbn.clientId,
            callbackRoute,
        );

        return res.redirect(redirectUrl);
    }
}

const authWithCompaniesOffice = (req, res) => {
    const service = 'companies-office';
    const callbackRoute = `/api/auth-with/${service}`;

    if (req.query.code) {
        requestOauthToken({
                oauthRoute: sails.config.mbie.companiesOffice.oauthURI + 'token',
                callbackRoute,
                code: req.query.code,
                clientId: sails.config.mbie.companiesOffice.consumerKey,
                consumerKey: sails.config.mbie.companiesOffice.consumerKey,
                consumerSecret: sails.config.mbie.companiesOffice.consumerSecret,
                serviceName: service,
                userId: req.user.id
            })
            .then(() => res.redirect('/'))
            .catch((error) => {
                sails.log.error(error);
                res.json({message: ['Something went wrong']});
            });
    }
    else if (req.query.error) {
        sails.log.error(req.query.error)
        res.redirect('/');
    }
    else {
        const redirectUrl = generateUrlForOauthLogin(
            sails.config.mbie.companiesOffice.oauthURI + 'authorize',
            sails.config.mbie.companiesOffice.consumerKey,
            callbackRoute,
            { scope: 'openid' }
        );

        return res.redirect(redirectUrl);
    }
}

export function authWith(req, res) {
    let authFunction = null;

    switch (req.params.service) {
        case 'nzbn':
            authFunction = authWithNzbn;
        case 'companies-office':
            authFunction = authWithCompaniesOffice;
            break;
    }

    if (!authFunction) {
        throw new Error("MBIE auth service '${req.params.service}' not found");
    }
    
    authFunction(req, res);
}

export function removeAuth(req, res) {
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

export function lookupByNzbn(nzbn) {
    return MbieApiBearerTokenService.getToken()
        .then(mbieBearerToken => {
            this.headers = {
                Accept: 'application/json',
                Authorization: 'Bearer ' + mbieBearerToken
            }

            return this.headers;
        })
        .then(headers => {
            const url = `${sails.config.mbie.uri}v3/nzbn/entities/${nzbn}`;
            UtilService.logRequest(url, this.headers);
            return fetch(url, { headers: this.headers });
        })
        .then(response => response.json())
        .catch(sails.log.error);
}
