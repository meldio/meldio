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


describe('Schema Validation: Filter / TypeMustBeDefined: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Filter cannot reference a nonexisting type', () => {
    const test = ` filter on NodeConnection(Widget) { } ${defs} `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.have.length(1);
    expect(errors).to.deep.match(
      /Filter on NodeConnection\(Widget\) references "Widget".* no such type/);
  });

  it('Filter can reference an existing Node type', () => {
    const test = ` filter on NodeConnection(Todo) { } ${defs} `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Filter can reference an existing Node type with edge props', () => {
    const test = ` filter on NodeConnection(Todo, EdgeProps) { } ${defs} `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Filter can reference an existing non-Node type', () => {
    const test = ` filter on ObjectConnection(EdgeProps) { } ${defs} `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Filter can reference an interface', () => {
    const test = ` filter on NodeConnection(Completeable) { } ${defs} `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Filter can reference a scalar', () => {
    const test = ` filter on ScalarConnection(String) { } ${defs} `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Filter can reference a scalar with edge props', () => {
    const test = ` filter on ScalarConnection(String, EdgeProps) { } ${defs} `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Filter can reference an enum with edge props', () => {
    const test = ` filter on ScalarConnection(Enum, EdgeProps) { } ${defs} `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Filter can reference a list of scalars', () => {
    const test = ` filter on [ID] { } ${defs} `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Filter can reference a list of enums', () => {
    const test = ` filter on [Enum] { } ${defs} `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Filter can reference a list of objects', () => {
    const test = ` filter on [EdgeProps] { } ${defs} `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Filter can reference a list of nodes', () => {
    const test = ` filter on [Todo] { } ${defs} `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

});
