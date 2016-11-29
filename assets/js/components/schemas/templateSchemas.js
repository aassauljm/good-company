import { mergeSchemas, resolveReferences } from '../jsonSchema';
import definitionsSchema from './definitions.json';

let templateSchemas = {
    transfer: require('./transfer.json'),
    special_resolution: require('./specialResolution.json'),
    ordinary_resolution: require('./ordinaryResolution.json'),
    board_resolution: require('./boardResolution.json'),
    entitled_persons_agreement: require('./entitledPersonsAgreement.json'),
    directors_certificate: require('./directorsCertificate.json'),
    notice_of_meeting: require('./noticeOfMeeting.json'),
    resignation_of_director: require('./resignationOfDirector.json')
}

Object.keys(templateSchemas).map((key) => {
    templateSchemas[key] = resolveReferences(mergeSchemas(templateSchemas[key], definitionsSchema));
});

export default templateSchemas;
