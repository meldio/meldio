import { expect } from 'chai';
import { describe, it } from 'mocha';
import { runTest, separateResults } from '../../../__tests__/setup';

import { NameInCamelCase as rule } from '../NameInCamelCase';

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

describe('Schema Validation: FilterConditionArgument / NameInCamelCase: ',
() => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Filter argument name camelCase is okay', () => {
    const test = `
      filter on NodeConnection(Todo) {
        STATUS: (statusCamel: Boolean) {
          node: { complete: { eq: $statusCamel } }
        }
        MATCH: (patternCamel: String) {
          node: { text: { matches: $patternCamel } }
        }
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

  it('Filter argument name SentanceCase gives a warning', () => {
    const test = `
      filter on NodeConnection(Todo) {
        STATUS: (StatusSentance: Boolean) {
          node: { complete: { eq: $StatusSentance } }
        }
        MATCH: (PatternSentance: String) {
          node: { text: { matches: $PatternSentance } }
        }
        MATCH_AND_STATUS: (Pattern: String, Status: Boolean) {
          node: {
            text: { matches: $Pattern }
            complete: { eq: $Status }
          }
        }
      }
      ${defs}
    `;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.have.length(4);
    warnings.forEach(warning =>
      expect(warning).to.deep.match(/should be in "camelCase"/));
  });

  it('Filter argument name _Underscore gives a warning', () => {
    const test = `
      filter on NodeConnection(Todo) {
        STATUS: (_Underscore: Boolean) {
          node: { complete: { eq: $_Underscore } }
        }
      }
      ${defs}
    `;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.have.length(1);
    expect(warnings).to.deep.match(/should be in "camelCase"/);
  });

  it('Mutation argument name _camelUnderscore gives a warning', () => {
    const test = `
      filter on NodeConnection(Todo) {
        STATUS: (_camelUnderscore: Boolean) {
          node: { complete: { eq: $_camelUnderscore } }
        }
      }
      ${defs}
    `;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.have.length(1);
    expect(warnings).to.deep.match(/should be in "camelCase"/);
  });

  it('Mutation argument name Underscore_ gives a warning', () => {
    const test = `
      filter on NodeConnection(Todo) {
        STATUS: (Underscore_: Boolean) {
          node: { complete: { eq: $Underscore_ } }
        }
      }
      ${defs}
    `;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.have.length(1);
    expect(warnings).to.deep.match(/should be in "camelCase"/);
  });

  it('Mutation argument name Mid_Underscore gives a warning', () => {
    const test = `
      filter on NodeConnection(Todo) {
        STATUS: (Mid_Underscore: Boolean) {
          node: { complete: { eq: $Mid_Underscore } }
        }
      }
      ${defs}
    `;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.have.length(1);
    expect(warnings).to.deep.match(/should be in "camelCase"/);
  });
});
