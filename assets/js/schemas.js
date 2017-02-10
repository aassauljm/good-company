"use strict";

export const relationNameToModelMap = {
    'directors': 'person',
    'holders': 'person',
    'shareClasses': 'shareClass',
    'parcels': 'parcel',
    'holdings': 'holding'
}

export const relationNameToModel = (key) => {
    return relationNameToModelMap[key] || key;
}