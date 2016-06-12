import nodemailer from 'nodemailer';
import Promise from 'bluebird';


let _transport;

module.exports = {
    getTransport: function() {
        if(!_transport){
            _transport = nodemailer.createTransport(sails.config.mail);
        }
        return _transport;
    },
    sendMail: function(destination, body){
        const transport = Promise.promisifyAll(MailService.getTransport());
        return transport.sendMail({
            from: sails.config.mail.from,
            to: destination,
            html: body
        })
        .then(info => {
            sails.log.error(info.response.toString())
        })
        .catch(e => {
            sails.log.error(e);
        })

    },
    signup: function(user){
        const template = 'Welcome to Good Company';
        return MailService.sendMail(user.email, template);
    }
};

