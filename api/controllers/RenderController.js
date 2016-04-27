"use strict";

import pdf from 'html-pdf';

module.exports = {

    renderShareRegister: function(req, res){
        RenderService.serverRender('/company/render/'+req.params.id+'/shareregister', req.get('cookie'), {})
            .then(result => {
                res.render('staticContent', {reactOutput: result.reactOutput, assets: sails.config.paths.public}, (err, html) => {
                    const options = { format: 'A4',"border": "2cm", "orientation": "portrait", "base": 'file://'+sails.config.paths.public};
                    pdf.create(html, options).toStream(function(err, stream){
                        if(err){
                            return res.negotiate(err);
                        }
                        res.setHeader('Content-disposition', `attachment; filename=Share Register.pdf`);
                        stream.pipe(res);
                    });
                });
            })
            .catch(res.negotiate)
    }
};