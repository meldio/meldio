import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
  inputOkListTypes,
  badListTypes,
} from '../../../__tests__/setup';

import { NoListOfList as rule } from '../NoListOfList';

const defs = `
  enum Enum { ONE, TWO, THREE }
  input Object { obj: String }

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

describe('Schema Validation: FilterConditionArgument / NoListOfList: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  inputOkListTypes.forEach(word =>
    it(`Filter arguments can be a list like this ${word}`, () => {
      const test = `
        filter on NodeConnection(Todo) {
          STATUS: (status: ${word}) {
            node: { complete: { eq: $status } }
          }
        }
        ${defs}
      `;

      const result = runTest(test);
      const { errors } = separateResults(result);
      expect(errors).to.have.length(0);
    }));

  badListTypes.forEach(word =>
    it(`Filter arguments can not be a list of list like this ${word}`, () => {
      const test = `
        filter on NodeConnection(Todo) {
          STATUS: (status: ${word}) {
            node: { complete: { eq: $status } }
          }
        }
        ${defs}
      `;

      const result = runTest(test);
      const { errors } = separateResults(result);
      expect(errors).to.deep.match(
        /list of list, which is currently not supported/);
    }));
});
