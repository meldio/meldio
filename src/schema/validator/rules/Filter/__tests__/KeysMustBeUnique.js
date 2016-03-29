import { expect } from 'chai';
import { describe, it } from 'mocha';
import { runTest, separateResults } from '../../../__tests__/setup';

import { KeysMustBeUnique as rule } from '../KeysMustBeUnique';

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

describe('Schema Validation: Filter / KeysMustBeUnique: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Filter with unique keys is okay', () => {
    const test = `
      filter on NodeConnection(Todo) { ONE: {} TWO: {} THREE: {} }
      ${defs} `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Filter with duplicate keys fails', () => {
    const test = `
      filter on NodeConnection(Todo) { ONE: {} TWO: {} TWO: {} THR: {} THR: {} }
      ${defs}
    `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.have.length(2);
    expect(errors).to.deep.match(
      /Filter on NodeConnection\(Todo\) defines "TWO" key multiple times/);
    expect(errors).to.deep.match(
      /Filter on NodeConnection\(Todo\) defines "THR" key multiple times/);
  });
});
