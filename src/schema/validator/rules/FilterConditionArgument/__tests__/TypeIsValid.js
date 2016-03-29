import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
  inputOkFieldTypes,
  inputBadFieldTypes,
} from '../../../__tests__/setup';

import { TypeIsValid as rule } from '../TypeIsValid';

const defs = `
  enum Enum { ONE, TWO, THREE }
  type Interface { obj: String }

  type User implements Node {
    id: ID!
    todos: NodeConnection(Todo, users)
  }

  type Todo implements Node {
    id: ID!
    text: String
    complete: Boolean
    users: NodeConnection(User, todos)
  }
`;

describe('Schema Validation: FilterConditionArgument / TypeIsValid: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  inputOkFieldTypes.forEach(word =>
    it(`Filter can have an argument of type ${word}`, () => {
      const test = `
        input Object { obj: String }
        filter on NodeConnection(Todo) {
          STATUS: (status: ${word}) {
            node: { complete: { eq: $status } }
          }
        }
        ${defs}`;

      const result = runTest(test);
      const { errors } = separateResults(result);
      expect(errors).to.have.length(0);
    }));

  inputBadFieldTypes.forEach(word =>
    it(`Filter can not have an argument of type ${word}`, () => {
      const test = `
        type Object implements Interface, Node { id: ID!, obj: String }
        type Foo implements Node { id: ID! }
        union Union = Foo | Object
        filter on NodeConnection(Todo) {
          STATUS: (status: ${word}) {
            node: { complete: { eq: $status } }
          }
        }
        ${defs}`;

      const result = runTest(test);
      const { errors } = separateResults(result);
      expect(errors).to.deep.match(
        /Filter on NodeConnection\(Todo\) .* "status" with an unsupported/);
    }));
});
