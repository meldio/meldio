import { expect } from 'chai';
import { describe, it } from 'mocha';
import { runTest, separateResults } from '../../../__tests__/setup';

import { NoUndefinedVariables as rule } from '../NoUndefinedVariables';

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

describe('Schema Validation: Filter / NoUndefinedVariables: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Filter is okay if all variables are defined', () => {
    const test = `
      filter on NodeConnection(Todo) {
        ACTIVE: { node: { complete: { eq: false } } }
        COMPLETED: { node: { complete: { eq: true } } }
        STATUS: (status: Boolean) { node: { complete: { eq: $status } } }
        MATCH: (pattern: String) { node: { text: { matches: $pattern } } }
        MATCH_AND_STATUS: (pattern: String, status: Boolean) {
          node: {
            text: { matches: $pattern }
            complete: { eq: $status }
          }
        }
      }
      ${defs}
    `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Filter fails if a variable is undefined', () => {
    const test = `
      filter on NodeConnection(Todo) {
        ACTIVE: { node: { complete: { eq: false } } }
        COMPLETED: { node: { complete: { eq: true } } }
        STATUS: (status: Boolean) { node: { complete: { eq: $status } } }
        MATCH: (pattern: String) { node: { text: { matches: $pattern } } }
        MATCH_AND_STATUS: (pattern: String) {
          node: {
            text: { matches: $pattern }
            complete: { eq: $status }
          }
        }
      }
      ${defs}
    `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.have.length(1);
    expect(errors).to.deep.match(
      /key "MATCH_AND_STATUS" .* contains an undefined variable "status"/);
  });

});
