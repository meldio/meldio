import { expect } from 'chai';
import { describe, it } from 'mocha';
import { runTest, separateResults } from '../../../__tests__/setup';

import { KeyInCapitalCase as rule } from '../KeyInCapitalCase';

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

describe('Schema Validation: Filter / KeyInCapitalCase: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Filter key CAPITAL_CASE_1 is okay', () => {
    const test = ` filter on [Todo] { CAPITAL_CASE_1: { } } ${defs}`;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Filter key _UNDERSCORE gives a warning', () => {
    const test = ` filter on [Todo] { _UNDERSCORE: { } } ${defs}`;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.have.length(1);
    expect(warnings).to.deep.match(/should be in "CAPITAL_CASE"/);
  });

  it('Filter key UNDERSCORE_ gives a warning', () => {
    const test = ` filter on [Todo] { UNDERSCORE_: { } } ${defs}`;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.have.length(1);
    expect(warnings).to.deep.match(/should be in "CAPITAL_CASE"/);
  });

  it('Filter key camelCase gives a warning', () => {
    const test = `filter on [Todo] {CAPITAL_CS_1: {}, camelCase: {}} ${defs}`;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.have.length(1);
    expect(warnings).to.deep.match(/should be in "CAPITAL_CASE"/);
  });

  it('Filter key SentenceCase gives a warning', () => {
    const t = `filter on [Todo] {CAPITAL_CS_1: {}, SentenceCase: {}} ${defs}`;
    const result = runTest(t);
    const { warnings } = separateResults(result);
    expect(warnings).to.have.length(1);
    expect(warnings).to.deep.match(/should be in "CAPITAL_CASE"/);
  });
});
