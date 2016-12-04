

module.exports = {
    billingInfo: function(req, res) {
        return sequelize.query("select billing_info()",
               { type: sequelize.QueryTypes.SELECT})
            .then((r) => {
                return res.json(r.map(r => r.billing_info))
            })
    }
};