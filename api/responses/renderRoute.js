
module.exports = function(renderProps) {
    const urls = {
        loginUrl: sails.config.USERS_LOGIN_URL,
        userUrl: sails.config.ACCOUNT_URL,
        logoutUrl: sails.config.USER_LOGOUT_URL
    }

    if(sails.config.serverRender){
        const req = this.req,
            res = this.res;

        const state = {login: {loggedIn: req.isAuthenticated(), ...urls}};

        RenderService.serverRender(req.url, req.get('cookie'), state)
            .then(result => {
                res.status(200);
                res.render('content', {reactOutput: result.reactOutput, data: result.data, _layoutFile: 'layout.ejs'});
            })
            .catch(result => {
                if(result.redirectLocation){
                    res.redirect(301, result.redirectLocation.pathname + result.redirectLocation.search);
                }
                else{
                    res.send(result.code, result.message);
                }
            })

    }
    else{
        this.res.render('content.ejs', { reactOutput: '', data: JSON.stringify(
                        {login: {loggedIn: this.req.isAuthenticated(), ...urls}}),  _layoutFile: 'layout.ejs'});
    }
}