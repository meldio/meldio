import { expect } from 'chai';
import { describe, it } from 'mocha';
import { runTest, separateResults } from '../../../__tests__/setup';

import { TypeMustBeDefined as rule } from '../TypeMustBeDefined';

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


describe('Schema Validation: Order / TypeMustBeDefined: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Order cannot reference a nonexisting type', () => {
    const test = ` order on NodeConnection(Widget) { } ${defs} `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.have.length(1);
    expect(errors).to.deep.match(
      /Order on NodeConnection\(Widget\) references "Widget".* no such type/);
  });

  it('Order can reference an existing Node type', () => {
    const test = ` order on NodeConnection(Todo) { } ${defs} `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Order can reference an existing Node type with edge props', () => {
    const test = ` order on NodeConnection(Todo, EdgeProps) { } ${defs} `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Order can reference an existing non-Node type', () => {
    const test = ` order on ObjectConnection(EdgeProps) { } ${defs} `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Order can reference an interface', () => {
    const test = ` order on NodeConnection(Completeable) { } ${defs} `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Order can reference a scalar', () => {
    const test = ` order on ScalarConnection(String) { } ${defs} `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Order can reference a scalar with edge props', () => {
    const test = ` order on ScalarConnection(String, EdgeProps) { } ${defs} `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Order can reference an enum with edge props', () => {
    const test = ` order on ScalarConnection(Enum, EdgeProps) { } ${defs} `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Order can reference a list of objects', () => {
    const test = ` order on [EdgeProps] { } ${defs} `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Order can reference a list of nodes', () => {
    const test = ` order on [Todo] { } ${defs} `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });
});
