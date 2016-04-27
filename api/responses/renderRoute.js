


module.exports = function(renderProps) {
    if(sails.config.serverRender){
        const req = this.req,
            res = this.res;
        const state = {login: {loggedIn: req.isAuthenticated()}, userInfo: req.user ? {...req.user.toJSON(), _status: 'complete'} : {}};
        RenderService.serverRender(req.url, req.get('cookie'), state)
            .then(result => {
                res.status(200);
                res.render('content', {reactOutput: result.reactOutput, data: result.data, _layoutFile: 'layout.ejs'});
            })
            .catch(result => {
                if(result.redirectLocation){
                    res.redirect(301, result.redirectLocation.pathname + result.redirectLocation.search)
                }
                else{
                    res.send(result.code, result.message)
                }
            })

    }
    else{
        this.res.render('content.ejs', { reactOutput: '', data: JSON.stringify(
                        {login: {loggedIn: this.req.isAuthenticated()}}),  _layoutFile: 'layout.ejs'});
    }
}