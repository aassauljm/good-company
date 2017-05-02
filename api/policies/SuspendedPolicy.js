module.exports = function(req, res, next) {
    return sequelize.query(`SELECT 1 FROM company WHERE suspended = false and id = :id`,
            { type: sequelize.QueryTypes.SELECT,
               replacements: { id: req.params.id }})
        .then(result => {
            if(!result.length){
                return res.forbidden({message: 'This company has been suspended'});
            }
            next();
        })
};