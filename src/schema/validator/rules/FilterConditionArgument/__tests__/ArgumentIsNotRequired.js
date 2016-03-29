import { expect } from 'chai';
import { describe, it } from 'mocha';
import { runTest, separateResults } from '../../../__tests__/setup';

import { ArgumentIsNotRequired as rule } from '../ArgumentIsNotRequired';

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

describe('Schema Validation: FilterConditionArgument / ArgumentIsNotRequired: ',
() => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Warning if filter argument is required', () => {
    const test = `
      filter on NodeConnection(Todo) {
        STATUS: (statusCamel: Boolean!) {
          node: { complete: { eq: $statusCamel } }
        }
        MATCH: (patternCamel: String!) {
          node: { text: { matches: $patternCamel } }
        }
        MATCH_AND_STATUS: (pattern: String!, status: Boolean!) {
          node: {
            text: { matches: $pattern }
            complete: { eq: $status }
          }
        }
      }
      ${defs}
    `;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.have.length(4);
    expect(warnings).to.deep.match(
      /NodeConnection\(Todo\) defines an argument "statusCamel" as required/);
    expect(warnings).to.deep.match(
      /NodeConnection\(Todo\) defines an argument "patternCamel" as required/);
    expect(warnings).to.deep.match(
      /NodeConnection\(Todo\) defines an argument "pattern" as required/);
    expect(warnings).to.deep.match(
      /NodeConnection\(Todo\) defines an argument "status" as required/);
  });
});
