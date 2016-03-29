import { expect } from 'chai';
import { describe, it } from 'mocha';
import { runTest, separateResults } from '../../../__tests__/setup';

import { NoVariables as rule } from '../NoVariables';

const defs = `
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

describe('Schema Validation: Order / NoVariables: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Order is okay if no variables are defined', () => {
    const test = `
      order on NodeConnection(Todo) {
        ACTIVE_FIRST: [
          { node: { complete: DESCENDING } }
          { node: { text: ASCENDING } }
        ]
        COMPLETED_FIRST: [
          { node: { complete: ASCENDING } }
          { node: { text: ASCENDING } }
        ]
        TEXT: [ { node: { text: ASCENDING } } ]
      }
      ${defs}
    `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Order fails if a variable is defined', () => {
    const test = `
      order on NodeConnection(Todo) {
        ACTIVE_FIRST: [
          { node: { complete: DESCENDING } }
          { node: { text: ASCENDING } }
        ]
        COMPLETED_FIRST: [
          { node: { complete: ASCENDING } }
          { node: { text: ASCENDING } }
        ]
        TEXT: [ { node: { text: $foo } } ]
      }
      ${defs}
    `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.have.length(1);
    expect(errors).to.deep.match(
      /"TEXT" of order on NodeConnection\(Todo\) contains "foo" variable ref/);
  });

});
