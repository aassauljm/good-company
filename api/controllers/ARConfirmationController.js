const actionUtil = require('sails-hook-sequelize-blueprints/actionUtil');


module.exports = {

    getARConfirmationFromCode: function(req, res) {
        return ARConfirmationRequest.find({
            where: {code: req.params.code},
            include: [{
                model: ARConfirmation,
                as: 'arConfirmation',
                include:  [{
                    model: User,
                    as: 'user',
                    attributes: ['username', 'email', 'id']
                }]
            }],
            order: [['name', 'ASC']]
        })
        .then((result) => {
            if(!result){
                return res.notFound();
            }
            return res.json(result);
        })
    },

    updateARConfirmationFromCode: function(req, res) {
        let company, companyName, arc;
        const values = actionUtil.parseValues(req);
        let newFeedback;
        return ARConfirmationRequest.find({
            where: {code: req.params.code},
            include: [{
                model: ARConfirmation,
                as: 'arConfirmation',
                include: [{
                    model: Company,
                    as: 'company'
                }, {
                    model: User,
                    as: 'user'
                }]
            }]
        })
        .then((_arc) => {
            arc = _arc;
            company = arc.arConfirmation.company;
            newFeedback = !arc.feedback && !!values.feedback;
            return arc.update({confirmed: values.confirmed, feedback: values.feedback})
        })
        .then(function(){
            return company.getNowCompanyState();
        })
        .then(state => {
            companyName = state.get('companyName');
            const name = req.user ? req.user.username : arc.name;
            const description = `Annual return ${values.feedback ? 'feedback' : 'confirmation'} for ${companyName}`
            return ActivityLog.create({
                type: values.feedback ? ActivityLog.types.AR_CONFIRMATION_FEEDBACK : ActivityLog.types.AR_CONFIRMATION,
                userId: req.user ? req.user.id : null,
                companyId: company.id,
                description: description,
                data: {companyId: company.id, externalUser: name}
            });
        })
        .then((result) => {
            if(!result){
                return res.notFound();
            }
            return res.json({message: `Annual return ${values.feedback ? 'reedback' : 'confirmation'} for ${companyName} submitted`});
        })
        .then(() => {
            if(false && newFeedback && (req.user || {}).id !== arc.arConfirmation.userId ){
                return MailService.sendARConfirmationFeedback({name: arc.arConfirmation.user.username,
                    email: arc.arConfirmation.user.email}, companyName, company.id, arc);
            }
        })
    }

};