import { expect } from 'chai';
import { describe, it } from 'mocha';
import { runTest, separateResults } from '../../../__tests__/setup';

import { KeyInCapitalCase as rule } from '../KeyInCapitalCase';

const def = `
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

describe('Schema Validation: Order / KeyInCapitalCase: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Order key CAPITAL_CASE_1 is okay', () => {
    const test = ` order on [Todo] { CAPITAL_CASE_1: [{ }] } ${def}`;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Order key _UNDERSCORE gives a warning', () => {
    const test = ` order on [Todo] { _UNDERSCORE: [{ }] } ${def}`;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.have.length(1);
    expect(warnings).to.deep.match(/should be in "CAPITAL_CASE"/);
  });

  it('Order key UNDERSCORE_ gives a warning', () => {
    const test = ` order on [Todo] { UNDERSCORE_: [{ }] } ${def}`;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.have.length(1);
    expect(warnings).to.deep.match(/should be in "CAPITAL_CASE"/);
  });

  it('Order key camelCase gives a warning', () => {
    const test = `order on [Todo] {CAPITAL_CS_1: [{}] camelCase: [{}]} ${def}`;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.have.length(1);
    expect(warnings).to.deep.match(/should be in "CAPITAL_CASE"/);
  });

  it('Order key SentenceCase gives a warning', () => {
    const t = `order on [Todo] {CAPITAL_CS_1: [{}] SentenceCase: [{}]} ${def}`;
    const result = runTest(t);
    const { warnings } = separateResults(result);
    expect(warnings).to.have.length(1);
    expect(warnings).to.deep.match(/should be in "CAPITAL_CASE"/);
  });
});
