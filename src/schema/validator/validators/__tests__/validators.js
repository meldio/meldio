import { expect } from 'chai';
import { describe, it } from 'mocha';

import { parse } from '../../../language';
import { analyzeAST } from '../../../analyzer';
import { validate } from '../../validate';

describe('Schema Validation: Validator Functions: ', () => {
  it('Validator functions do not fail when rules are missing',() => {
    const test = `
      enum Enum { ONE TWO }
      input TestInput {
        foo: Int
      }
      interface Named @rootConnection(field: "allNamed") {
        name: String @boom
      }
      mutation mut(int: Int) @boom {
        newFoo: Foo @boom
      }
      type Foo implements Named, Node @rootConnection(field: "allFoos") {
        id: ID!
        name: String @rootPluralId(field: "fooByName")
      }
      union U = Foo @rootConnection(field: "allUs") `;
    const ast = parse(test);
    const schema = analyzeAST(ast);
    const result = validate(schema, { });
    expect(result).to.have.length(0);
  });
});
