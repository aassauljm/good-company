var merge = require('deepmerge')

// Merge two schemas.
// Primary schema takes precedence where there a duplicate keys
export const mergeSchemas = (primarySchema, secondarySchema) => {
    // Using deepmerge; the second parameter takes precedence
    return merge(secondarySchema, primarySchema);
}

export const resolveReferences = (rootSchema) => {
    const deepFind = (schema, keys) => {
        if (keys.length == 0) {
            throw new Exception('At least one key must be passed for deepFind()')
        }

        if (keys.length == 1) {
            return schema[keys[0]]
        }

        return deepFind(schema[keys[0]], keys.splice(1));
    }

    const resolveChildReferences = (item) => {
        // If this item is has a ref property: replace it with the reference it is pointing to
        if (item instanceof Object && item['$ref']) {
            const definitionKeys = item['$ref'].split('/');

            // # = root schema
            if (definitionKeys[0] == '#') {
                // Find the replacement value for the reference
                const refReplacement = deepFind(rootSchema, definitionKeys.splice(1));

                // Resolve the references of the reference replacement value and return it
                return resolveChildReferences(refReplacement);
            } else {
                throw new Exception("Non-absolute references are not currently supported");
            }
        }

        // If this item is an array: loop it's values and recurse on them
        if (Array.isArray(item)) {
            item.map((innerItem, i) => {
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

    return resolveChildReferences(rootSchema, []);
}
