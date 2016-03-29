import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
  tokenTypeDef
} from '../../../__tests__/setup';

import { EdgeConnectionIsDefined as rule } from '../EdgeConnectionIsDefined';

describe('Schema Validation: MutationField / EdgeConnectionIsDefined: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Throws if Edge is defined and connection is not', () => {
    const test = `
      mutation testMutation(id: ID!) {
        edge: Edge(Foo, Bar)
      } ${tokenTypeDef} `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /connection field with these properties has not been defined elsewhere/);
  });

  it('Throws if Edge without edge type is defined and connection is not',
  () => {
    const test = `
      mutation testMutation(id: ID!) {
        edge: Edge(Foo)
      } ${tokenTypeDef} `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /connection field with these properties has not been defined elsewhere/);
  });

  it('Ok if connection is defined',
  () => {
    const test = `
      type EdgeProps { label: String }
      type MainType implements Node {
        id: ID!
        conn: ScalarConnection(Int, EdgeProps)
      }
      mutation testMutation(id: ID!) {
        edge: Edge(Int, EdgeProps)
      } ${tokenTypeDef} `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });
});
