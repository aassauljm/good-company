import chai from 'chai';
import { mergeSchemas } from '../../../assets/js/components/jsonSchema';
import { resolveReferences } from '../../../assets/js/components/jsonSchema';

const should = chai.should();

const definitions = {"definitions": {
    "string": "someRandomText",
    "number": 62,
    "array": ["one", "two", "three"],
    "object": { "object": "objectDefinedInDefinitions" }
}};

const jsonWithoutReferences = {
    "array": ["one", "two", "three"],
    "number": 15,
    "$notARef": "testing",
    "object": {
        "child": "childValue",
        "childObject":  {
            "testing": 17
        }
    }
};

const jsonWithStringReference = {
    "number": 15,
    "string": {"$ref": "#/definitions/string"},
    "object": {
        "child": "childValue",
        "childObject": {
            "testing": 17
        }
    }
};

const jsonWithResolvedStringReferences = {
    "number": 15,
    "string": "someRandomText",
    "object": {
        "child": "childValue",
        "childObject": {
            "testing": 17
        }
    }
};

const jsonWithNumberReference = {
    "object": {
        "number": {"$ref": "#/definitions/number"},
        "childObject": {
            "testing": 17
        }
    }
};

const jsonWithResolvedNumberReference = {
    "object": {
        "number": 62,
        "childObject": {
            "testing": 17
        }
    }
};

const jsonWithArrayReference = {
    "object": {
        "item one": 66,
        "innerArray": {"$ref": "#/definitions/array"}
    }
};

const jsonWithResolvedArrayReference = {
    "object": {
        "item one": 66,
        "innerArray": ["one", "two", "three"]
    }
};

const jsonArrayWithReference = {
    "array": [
        {
            "objectOne": 1911,
            "testRef": {"$ref": "#/definitions/string"}
        }
    ]
}

const jsonArrayWithResolvedReference = {
    "array": [
        {
            "objectOne": 1911,
            "testRef": "someRandomText"
        }
    ]
}

const jsonWithObjectReference = {
    "anObject": {"$ref": "#/definitions/object"}
};

const jsonWithResolvedObjectReference = {
    "anObject": {"object": "objectDefinedInDefinitions"}
};

const jsonWithMultipleReferences = {
    "anObject": {"$ref": "#/definitions/object"},
    "nonReference": 72,
    "stringReference": {"$ref": "#/definitions/string"},
    "numberReference": {"$ref": "#/definitions/number"},
    "arrayReference": {"$ref": "#/definitions/array"}
};

const jsonWithMultipleResolvedReferences = {
    "anObject": {"object": "objectDefinedInDefinitions"},
    "nonReference": 72,
    "stringReference": "someRandomText",
    "numberReference": 62,
    "arrayReference": ["one", "two", "three"]
};

describe('JSON Schema', function() {
    describe('Merge schemas', function() {
        it('Should merge two schemas', function(done) {
            mergeSchemas({"one": 1}, {"two": 2}).should.be.deep.equal({"one": 1, "two": 2});
            done();
        });

        describe('Merge two schemas with duplicate keys', function() {
            it('Should merge two schemas', function(done) {
                mergeSchemas({
                    "definitions": {
                        "test": "I'll still be here"
                    }
                }, {
                    "test": "I should not be removed",
                    "definitions": "I should be removed"
                }).should.be.deep.equal({
                    "definitions": {
                        "test": "I'll still be here"
                    },
                    "test": "I should not be removed",
                });

                done();
            });

            it('Should merge two objects if duplicate keys are both for objects', function(done) {
                mergeSchemas({
                    "definitions": {
                        "test": "I'll still be here"
                    }
                }, {
                    "test": "I should not be removed",
                    "definitions": {
                        "test_two": "I should also still be here"
                    }
                }).should.be.deep.equal({
                    "definitions": {
                        "test": "I'll still be here",
                        "test_two": "I should also still be here"
                    },
                    "test": "I should not be removed",
                });

                done();
            });
        });
    });

    describe('Process references', function() {
        describe('Objects without references', function() {
            it('Should not change schema without references', function(done) {
                resolveReferences(jsonWithoutReferences, definitions).should.be.deep.equal(jsonWithoutReferences);
                done();
            });
        });

        describe('Objects with a single reference', function() {
            it('Should replace string references', function(done) {
                resolveReferences(jsonWithStringReference, definitions).should.be.deep.equal(jsonWithResolvedStringReferences);
                done();
            });

            it('Should replace number references', function(done) {
                resolveReferences(jsonWithNumberReference, definitions).should.be.deep.equal(jsonWithResolvedNumberReference);
                done();
            });

            it('Should replace array references', function(done) {
                resolveReferences(jsonWithArrayReference, definitions).should.be.deep.equal(jsonWithResolvedArrayReference);
                done();
            });

            it('Should replace references in array', function(done) {
                resolveReferences(jsonArrayWithReference, definitions).should.be.deep.equal(jsonArrayWithResolvedReference);
                done();
            });

            it('Should replace object references', function(done) {
                resolveReferences(jsonWithObjectReference, definitions).should.be.deep.equal(jsonWithResolvedObjectReference);
                done();
            });
        });

        describe('Objects with multiple references', function() {
            it('Should replace all references', function(done) {
                resolveReferences(jsonWithMultipleReferences, definitions).should.be.deep.equal(jsonWithMultipleResolvedReferences);
                done();
            });
        });
    });
});
