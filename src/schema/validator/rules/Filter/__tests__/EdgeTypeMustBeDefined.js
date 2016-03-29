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


describe('Schema Validation: Filter / EdgeTypeMustBeDefined: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Filter cannot reference a nonexisting edge type', () => {
    const test = ` filter on NodeConnection(Todo, EdgePr) { } ${defs} `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.have.length(1);
    expect(errors).to.deep.match(
      /Filter on NodeConnection\(Todo, EdgePr\) references "EdgePr" edge/);
  });

  it('Filter cannot reference a Node edge type', () => {
    const test = ` filter on NodeConnection(Todo, User) { } ${defs} `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.have.length(1);
    expect(errors).to.deep.match(
      /Filter on NodeConnection\(Todo, User\) references "User" edge/);
  });

  it('Filter cannot reference a scalar edge type', () => {
    const test = ` filter on NodeConnection(Todo, Float) { } ${defs} `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.have.length(1);
    expect(errors).to.deep.match(
      /Filter on NodeConnection\(Todo, Float\) references "Float" edge/);
  });

  it('Filter can reference a valid edge type', () => {
    const test = ` filter on NodeConnection(Todo, EdgeProps) { } ${defs} `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Filter can reference a scalar and a valid edge type', () => {
    const test = ` filter on ScalarConnection(Float, EdgeProps) { } ${defs} `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });
});
