import https from 'https';
import fetch from "isomorphic-fetch";
import Promise from 'bluebird';


function generateUrlForOauthLogin(url, clientId, callbackRoute, extraQueryParameters) {
    const queryParameters = {
        client_id: clientId,
        redirect_uri: sails.config.APP_URL + callbackRoute,
        response_type: 'code',
        ...extraQueryParameters
    }

    return UtilService.buildUrl(url, queryParameters);
}

export function requestOauthToken(url, consumerKey, consumerSecret) {
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

    return Promise.resolve({})
        .then(() => fetch(url, tokenRequestOptions))
        .then(response => response.json())
}



function getOauthToken({oauthRoute, callbackRoute, code, clientId, consumerKey, consumerSecret, serviceName, userId}) {
    const url = UtilService.buildUrl(oauthRoute, {
        code: code,
        grant_type: 'authorization_code',
        client_id: clientId,
        redirect_uri: sails.config.APP_URL + callbackRoute
    });
    sails.log.verbose('Requesting url: ' + url)
    return MbieApiService.requestOauthToken(url, consumerKey, consumerSecret)
        .then(oauthResponse => {
            if (oauthResponse.error) {
                throw new Error(oauthResponse);
            }

            // Add token to database
            const data = {
                accessToken: oauthResponse.access_token,
                tokenType: oauthResponse.token_type.toLowerCase(),
                refreshToken: oauthResponse.refresh_token,
                expiresIn: oauthResponse.expires_in,
                service: serviceName,
                ownerId: userId
            };
            sails.log.verbose(JSON.stringify({
                message: 'oauth requested',
                ...data
            }))
            return sequelize.transaction(() => {
                return ApiCredential.create(data)
                    .then(apiCredential => {
                        const scopes = oauthResponse.scope.split(' ');
                        return apiCredential.addScopes(scopes);
                    })
                })
        });
}

const authWithService = (config) => (req, res) => {
    const service = config.service
    const callbackRoute = `/api/auth-with/${service}`;

    if (req.query.code) {
        return getOauthToken({
                oauthRoute: config.oauth.url + 'token',
                callbackRoute,
                code: req.query.code,
                clientId: config.oauth.clientId,
                consumerKey: config.oauth.consumerKey,
                consumerSecret: config.oauth.consumerSecret,
                serviceName: service,
                userId: req.user.id
            })
            .then(() => {
                let url;
                if(req.session.redirect){
                    url = req.session.redirect;
                    delete req.session.redirect;
                }
                else{
                    url = config.redirect;
                }
                res.redirect(url);
            })
            .catch(error => res.redirect(`/?error=${config.errorType}`));
    }
    else if (req.query.error) {
        sails.log.error(req.query.error)
        res.redirect(`/?error=${config.errorType}`);
    }
    else {
        const redirectUrl = generateUrlForOauthLogin(
            config.oauth.url + 'authorize',
            config.oauth.clientId,
            callbackRoute,
            config.scope
        );
        sails.log.verbose('Redirecting to: ' +redirectUrl)
        return res.redirect(redirectUrl);
    }
}

const authWithNzbn = (req, res) => {
    return authWithService({
        ...sails.config.mbie.nzbn,
        service: 'nzbn',
        scope: { scope: 'openid' },
        redirect: '/import/nzbn',
        errorType: 'FAIL_NZBN'
    })(req, res);
}


const authWithCompaniesOffice = (req, res) => {
    return authWithService({
        ...sails.config.mbie.companiesOffice,
        service: 'companies-office',
        scope: { scope: 'openid' },
        redirect: '/',
        errorType: 'FAIL_COMPANIES_OFFICE'
    })(req, res);
}


export function authWith(req, res) {
    let authFunction = null;

    switch (req.params.service) {
        case 'nzbn':
            authFunction = authWithNzbn;
            break;
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
    const service = req.params.service;

    return ApiCredential.findAll({
        where: {
            service,
            ownerId: req.user.id
        }
    })
    .then(creds => {
        return Promise.all(creds.map(c => {
            return MbieApiBearerTokenService.revoke(service, c.accessToken).then(() => c.destroy())
        }))
    })
    .then(() => res.json({message: ['Integration disconnected']}));
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
            const url = `${sails.config.mbie.nzbn.url}v3/nzbn/entities/${nzbn}`;
            UtilService.logRequest(url, this.headers);
            return fetch(url, { headers: this.headers });
        })
        .then(response => response.json()) //DANGER< swallows error
        .catch(sails.log.error);
}
