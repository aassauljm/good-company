module.exports = function (req, res, next) {
    req.waitForRequestLog = true;
    next();
}