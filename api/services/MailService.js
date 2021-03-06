import Promise from 'bluebird';
import fetch from "isomorphic-fetch";
import FormData from 'form-data';
var mime = require('mime-types');


import fs from 'fs'

let _transport;

module.exports = {
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
    massSendCataLexMailWithAttachment: function(template, recipients, subject, file, filename, sender) {
        sails.log.info(`Mass Sending Mail with Document to ${recipients.length} recipients from ${sender.name} (${sender.email})`);

        let form = new FormData();

        form.append('client_id', sails.config.OAUTH_CLIENT_ID);
        form.append('client_secret', sails.config.OAUTH_CLIENT_SECRET);
        form.append('template', template);
        form.append('subject', subject);
        form.append('recipients', JSON.stringify(recipients));
        form.append('sender_name', sender.name);
        form.append('sender_email', sender.email);

        form.append('files', file, {filename: filename});

        return fetch(sails.config.ACCOUNT_URL + '/mail/send-documents', {
            method: 'POST',
            header: {
                'Accept': '*/*',
                'Content-type': 'multipart/form-data'
            },
            body: form
        });
    },
    signup: function(user) {
        const template = 'Welcome to Good Company';
        return MailService.sendMail(user.email, template);
    },
    sendImportComplete: function(user, successCount, totalCount){
        if((user.settings || {}).importEmail !== false){
            return MailService.sendCataLexMail('emails.goodcompanies.import-complete', user.email, 'Good Companies - Companies Imported',
                                               {name: user.username, successCount, totalCount, link: sails.config.APP_URL})
        }
    },
    sendTransactionsComplete: function(user, successCount, totalCount){
        if((user.settings || {}).transactionEmail !== false){
            return MailService.sendCataLexMail('emails.goodcompanies.bulk-setup', user.email, 'Good Companies - Companies Import History Complete',
                                           {name: user.username, successCount, totalCount, link: sails.config.APP_URL})
        }
    },
    sendARConfirmationRequest: function(recipient, companyName, code, requestBy, sender){
        return MailService.sendCataLexMail('emails.goodcompanies.request-ar-confirmation', recipient.email, 'Good Companies - Annual Return Confirmation',
                                           {name: recipient.name, companyName, requestBy: requestBy || '', link: `${sails.config.APP_URL}/ar_confirmation/${code}`, inviter: sender.username})
    },
    sendARConfirmationFeedback: function(recipient, companyName, companyId, feedbacker){
        return MailService.sendCataLexMail('emails.goodcompanies.ar-feedback', recipient.email, 'Good Companies - Annual Return Feedback',
                                           {name: recipient.name, companyName,  link: `${sails.config.APP_URL}/company/view/${companyId}/review_annual_return`, feedbacker: feedbacker.name})
    },
    sendTemplate: function(recipients, file, filename, sender) {
        return MailService.massSendCataLexMailWithAttachment('emails.goodcompanies.attach-files', recipients, 'Document from Good Companies', file, filename, sender);
    }
};

