var merge = require('deepmerge')

// Merge two schemas.
// Primary schema takes precedence where there a duplicate keys
export const mergeSchemas = (primarySchema, secondarySchema) => {

}

export const resolveReferences = (rootSchema, definitions) => {
    const resolveChildReferences = (item) => {
        // If this item is has a ref property: replace it with the reference it is pointing to
        if (item['$ref']) {
            let definitionKeys = item['$ref'].split('/');

            if (definitionKeys[0] == '#') {
                definitionKeys = definitionKeys.splice(1, 2);
            }

            return definitions[definitionKeys[0]][definitionKeys[1]];
        }

        // If this item is an array: loop it's values and recurse on them
        if (Array.isArray(item)) {
            item.map((innerItem) => {
                innerItem = resolveChildReferences(innerItem);
            });
        }

        // If this item is a object: loop it's keys and recurse on them
        if (item instanceof Object) {
            Object.keys(item).map((key) => {
                if (item instanceof Object) {
                    item[key] = resolveChildReferences(item[key]);
                }
            });
        }

        // Return the processed item
        return item;
    }

    return resolveChildReferences(rootSchema);
}
