module.exports = function(req, res, next) {
    req.query.id = req.user.id;
    return next();
};