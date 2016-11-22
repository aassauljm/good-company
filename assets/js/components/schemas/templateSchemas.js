import { mergeSchemas, resolveReferences } from '../jsonSchema';
import definitionsSchema from './definitions.json';

let templateSchemas = {
    transfer: require('./transfer.json'),
    specialResolution: require('./specialResolution.json'),
    ordinaryResolution: require('./ordinaryResolution.json'),
    genericBoardResolution: require('./genericBoardResolution.json'),
    entitledPersonsAgreement: require('./entitledPersonsAgreement.json')
}

Object.keys(templateSchemas).map((key) => {
    templateSchemas[key] = resolveReferences(mergeSchemas(templateSchemas[key], definitionsSchema));
});

export default templateSchemas;
