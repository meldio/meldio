import { expect } from 'chai';
import { describe, it } from 'mocha';
import { runTest, separateResults } from '../../../__tests__/setup';

import { TypeMustBeConsistent as rule } from '../TypeMustBeConsistent';

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

describe('Schema Validation: FilterConditionArgument / TypeMustBeConsistent: ',
() => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Throws if repeated arguments have different types', () => {
    const test = `
      filter on NodeConnection(Todo) {
        STATUS: (status: Boolean) { node: { complete: { eq: $status } } }
        TEXT: (status: String) { node: { text: { matches: $status } } }
      }
      ${defs}`;

    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.have.length(2);
    expect(errors).to.deep.match(
      /"status" under "STATUS" key, however .* following key\(s\): "TEXT"/);
    expect(errors).to.deep.match(
      /"status" under "TEXT" key, however .* following key\(s\): "STATUS"/);
  });

  it('Okay if repeated arguments have the same types', () => {
    const test = `
      filter on NodeConnection(Todo) {
        STATUS: (status: Boolean) { node: { complete: { eq: $status } } }
        TEXT: (status: Boolean, text: String) {
          node: { text: { matches: $text }, complete: { eq: $status } } }
      }
      ${defs}`;

    const result = runTest(test);
    expect(result).to.have.length(0);
  });

});
