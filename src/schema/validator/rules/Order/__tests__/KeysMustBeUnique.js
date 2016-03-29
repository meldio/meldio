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

describe('Schema Validation: Order / KeysMustBeUnique: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Order with unique keys is okay', () => {
    const test = `
      order on NodeConnection(Todo) {
        ONE: [{}]
        TWO: [{}]
        THREE: [{}]
      } ${defs}`;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Order with duplicate keys fails', () => {
    const test = `
      order on NodeConnection(Todo) {
        THREE: [{}]
        TWO: [{}]
        ONE: [{}]
        TWO: [{}]
        THREE: [{}]
      }
      ${defs}
    `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.have.length(2);
    expect(errors).to.deep.match(
      /Order on NodeConnection\(Todo\) defines "THREE" key multiple time/);
    expect(errors).to.deep.match(
      /Order on NodeConnection\(Todo\) defines "TWO" key multiple times/);
  });
});
