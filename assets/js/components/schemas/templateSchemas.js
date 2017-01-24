import { mergeSchemas, resolveReferences } from '../jsonSchema';
import definitionsSchema from './definitions.json';

let templateSchemas = {
    transfer:                     require('good-companies-templates/schemas/transfer.json'),
    special_resolution:           require('good-companies-templates/schemas/specialResolution.json'),
    ordinary_resolution:          require('good-companies-templates/schemas/ordinaryResolution.json'),
    board_resolution:             require('good-companies-templates/schemas/boardResolution.json'),
    entitled_persons_agreement:   require('good-companies-templates/schemas/entitledPersonsAgreement.json'),
    directors_certificate:        require('good-companies-templates/schemas/directorsCertificate.json'),
    notice_of_meeting:            require('good-companies-templates/schemas/noticeOfMeeting.json'),
    resignation_of_director:      require('good-companies-templates/schemas/resignationOfDirector.json')
}

Object.keys(templateSchemas).map((key) => {
    templateSchemas[key] = resolveReferences(mergeSchemas(templateSchemas[key], definitionsSchema));
});

export default templateSchemas;
