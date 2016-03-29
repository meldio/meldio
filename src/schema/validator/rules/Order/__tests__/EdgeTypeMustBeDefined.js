import { expect } from 'chai';
import { describe, it } from 'mocha';
import { runTest, separateResults } from '../../../__tests__/setup';

import { EdgeTypeMustBeDefined as rule } from '../EdgeTypeMustBeDefined';

const defs = `
  enum Enum { ONE, TWO, THREE }
  input TestIn { one: String }
  type EdgeProps { distance: Float }
  interface Completeable { complete: Boolean }

  type User implements Node {
    id: ID!
    todos: NodeConnection(Todo, users)
  }

  type Todo implements Node, Completeable {
    id: ID!
    text: String
    complete: Boolean
    users: NodeConnection(User, todos)
  }
`;


describe('Schema Validation: Order / EdgeTypeMustBeDefined: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Order cannot reference a nonexisting edge type', () => {
    const test = ` order on NodeConnection(Todo, EdgePr) { } ${defs} `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.have.length(1);
    expect(errors).to.deep.match(
      /Order on NodeConnection\(Todo, EdgePr\) references "EdgePr" edge/);
  });

  it('Order cannot reference a Node edge type', () => {
    const test = ` order on NodeConnection(Todo, User) { } ${defs} `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.have.length(1);
    expect(errors).to.deep.match(
      /Order on NodeConnection\(Todo, User\) references "User" edge/);
  });

  it('Order cannot reference a scalar edge type', () => {
    const test = ` order on NodeConnection(Todo, Float) { } ${defs} `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.have.length(1);
    expect(errors).to.deep.match(
      /Order on NodeConnection\(Todo, Float\) references "Float" edge/);
  });

  it('Order can reference a valid edge type', () => {
    const test = ` order on NodeConnection(Todo, EdgeProps) { } ${defs} `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Order can reference a scalar and a valid edge type', () => {
    const test = ` order on ScalarConnection(Float, EdgeProps) { } ${defs} `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });
});
