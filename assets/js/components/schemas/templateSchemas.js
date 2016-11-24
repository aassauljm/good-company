import { mergeSchemas, resolveReferences } from '../jsonSchema';
import definitionsSchema from './definitions.json';

let templateSchemas = {
    transfer: require('./transfer.json'),
    specialResolution: require('./specialResolution.json'),
    ordinaryResolution: require('./ordinaryResolution.json'),
    boardResolution: require('./boardResolution.json'),
    entitledPersonsAgreement: require('./entitledPersonsAgreement.json'),
    directorsCertificate: require('./directorsCertificate.json'),
    noticeOfMeeting: require('./noticeOfMeeting.json'),
    optOutShareholderResolution: require('./optOutShareholderResolution.json'),
    resignationOfDirector: require('./resignationOfDirector.json')
}

Object.keys(templateSchemas).map((key) => {
    templateSchemas[key] = resolveReferences(mergeSchemas(templateSchemas[key], definitionsSchema));
});

export default templateSchemas;
