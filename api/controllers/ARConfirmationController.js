const actionUtil = require('sails-hook-sequelize-blueprints/actionUtil');


module.exports = {

    getARConfirmationFromCode: function(req, res) {
        return ARConfirmationRequest.find({
            where: {code: req.params.code},
            include: [{
                model: ARConfirmation,
                as: 'arConfirmation'
            }]
        })
        .then((result) => {
            if(!result){
                return res.notFound();
            }
            return res.json(result);
        })
    },

    postARConfirmationFromCode: function(req, res) {
        const values = actionUtil.parseValues(req);
        return ARConfirmationRequest.update({confirmed: values.confirmed, feedback: values.feedback}, {where: {code: req.params.code}})
        .then((result) => {
            if(!result){
                return res.notFound();
            }
            return res.json({message: 'Feedback submitted'});
        })
    }

};