import nodemailer from 'nodemailer';
import Promise from 'bluebird';
import fetch from "isomorphic-fetch";
import FormData from 'form-data';

let _transport;

module.exports = {
    getTransport: function() {
        if(!_transport){
            _transport = nodemailer.createTransport(sails.config.mail);
        }
        return _transport;
    },
    sendMail: function(destination, body) {
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
    sendCataLexMail: function(template, email, subject, data) {
        sails.log.info(`Sending Mail: ${email} ${subject} ${template} ${JSON.stringify(data)}`);
        var form = new FormData();
        form.append('client_id', sails.config.OAUTH_CLIENT_ID);
        form.append('client_secret', sails.config.OAUTH_CLIENT_SECRET);
        form.append('data', JSON.stringify(data));
        form.append('subject', subject);
        form.append('email', email);
        form.append('template', template);
        return fetch(sails.config.EMAIL_URL, {
            method: 'POST',
              header: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
              body: form
        })
    },
    signup: function(user) {
        const template = 'Welcome to Good Company';
        return MailService.sendMail(user.email, template);
    },
    sendImportComplete: function(user, successCount, totalCount){
        return MailService.sendCataLexMail('emails.goodcompanies.import-complete', user.email, 'Good Companies - Companies Imported',
                                           {name: user.username, successCount, totalCount, link: sails.config.APP_URL})
    },
    sendTransactionsComplete: function(user, successCount, totalCount){
        return MailService.sendCataLexMail('emails.goodcompanies.import-complete', user.email, 'Good Companies - Companies Transactions Complete',
                                           {name: user.username, successCount, totalCount, link: sails.config.APP_URL})
    }
};

