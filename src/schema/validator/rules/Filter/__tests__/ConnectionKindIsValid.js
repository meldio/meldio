import { expect } from 'chai';
import { describe, it } from 'mocha';
import { runTest, separateResults } from '../../../__tests__/setup';

import { ConnectionKindIsValid as rule } from '../ConnectionKindIsValid';

const defs = `
  enum Enum { ONE, TWO, THREE }
  interface SimpleInter { distance: Float }
  type SimpleType implements SimpleInter { distance: Float }
  union SimpleUnion = SimpleType

  interface NodeInter { complete: Boolean }

  type User implements Node {
    id: ID!
    todos: NodeConnection(Todo, users)
  }

  type Todo implements Node, NodeInter {
    id: ID!
    text: String
    complete: Boolean
    users: NodeConnection(User, todos)
  }

  union NodeUnion = User | Todo
`;


describe('Schema Validation: Filter / ConnectionKindIsValid: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('ScalarConnection cannot reference a non-scalar', () => {
    const test = `
      filter on ScalarConnection(Todo) { }
      filter on ScalarConnection(NodeUnion) { }
      filter on ScalarConnection(NodeInter) { }
      ${defs}
    `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.have.length(3);
    expect(errors).to.deep.match(
      /Filter on ScalarConnection\(Todo\) .* "Todo" that is not scalar/);
    expect(errors).to.deep.match(
      /Filter on ScalarConnection\(NodeUnion\) .* "NodeUnion" .* not scalar/);
    expect(errors).to.deep.match(
      /Filter on ScalarConnection\(NodeInter\) .* "NodeInter" .* not scalar/);
  });

  it('ScalarConnection can reference any scalar or enum', () => {
    const test = `
      filter on ScalarConnection(Enum) { }
      filter on ScalarConnection(Int) { }
      filter on ScalarConnection(Float) { }
      filter on ScalarConnection(ID) { }
      filter on ScalarConnection(String) { }
      filter on ScalarConnection(Boolean) { }
      ${defs}
    `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('ObjectConnection cannot reference a Node implementation', () => {
    const test = `
      filter on ObjectConnection(Todo) { }
      filter on ObjectConnection(NodeUnion) { }
      filter on ObjectConnection(NodeInter) { }
      ${defs}
    `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.have.length(3);
    expect(errors).to.deep.match(
      /Filter on ObjectConnection\(Todo\) .* "Todo" which is invalid/);
    expect(errors).to.deep.match(
      /Filter on ObjectConnection\(NodeUnion\).* "NodeUnion" which is invalid/);
    expect(errors).to.deep.match(
      /Filter on ObjectConnection\(NodeInter\).* "NodeInter" which is invalid/);
  });

  it('NodeConnection cannot reference a non-Node implementation', () => {
    const test = `
      filter on NodeConnection(SimpleType) { }
      filter on NodeConnection(SimpleInter) { }
      filter on NodeConnection(SimpleUnion) { }
      ${defs}
    `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.have.length(3);
    expect(errors).to.deep.match(
      /Filter on NodeConnection\(SimpleType\).* "SimpleType" which is invalid/);
    expect(errors).to.deep.match(
      /Filter on NodeConnection\(SimpleInter\).* "SimpleInter" .* is invalid/);
    expect(errors).to.deep.match(
      /Filter on NodeConnection\(SimpleUnion\).* "SimpleUnion" .* is invalid/);
  });

});
