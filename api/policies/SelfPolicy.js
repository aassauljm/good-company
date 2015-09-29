module.exports = function(req, res, next) {
    if(req.query && req.user && req.query.id === req.user.id){
        return next();
    }
    else
        return res.forbidden();
};