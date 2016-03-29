import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
  tokenTypeDef
} from '../../../__tests__/setup';

import { NodeMustDefineId as rule } from '../NodeMustDefineId';

describe('Schema Validation: Type / NodeMustDefineId: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Type that implements Node is okay with an id:ID! field', () => {
    const test = ` type GoodStuff implements Node { id: ID! } `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Type that doesn\'t implement Node is okay without an id field', () => {
    const test = ` type AlsoGoodStuff { foo: String } ${tokenTypeDef}`;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Type that implements Node cannot have id field of String type', () => {
    const test = ` type FailFaster implements Node { id: String } `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(/must include id field of type ID!/);
  });

  it('Type that implements Node cannot have id field of Int type', () => {
    const test = ` type FailFaster implements Node { id: Int } `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(/must include id field of type ID!/);
  });

  it('Type that implements Node must have a required id field', () => {
    const test = ` type FailFaster implements Node { id: ID } `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(/must include id field of type ID!/);
  });
});
