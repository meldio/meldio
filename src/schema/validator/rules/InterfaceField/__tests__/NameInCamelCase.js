import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
  tokenTypeDef,
} from '../../../__tests__/setup';

import { NameInCamelCase as rule } from '../NameInCamelCase';

describe('Schema Validation: InterfaceField / NameInCamelCase: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Interface field name camelCase is okay', () => {
    const test = ` interface SentanceCase { id: ID! camelCase: String }
      ${tokenTypeDef}`;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Interface field name SentanceCase gives a warning', () => {
    const test = ` interface SentanceCaseType { id: ID! SentanceCase: String }
      ${tokenTypeDef}`;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.deep.match(/should be in "camelCase"/);
  });

  it('Interface field name Underscore_ gives a warning', () => {
    const test = ` interface SentanceCase { id: ID! Underscore_: String }
      ${tokenTypeDef}`;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.deep.match(/should be in "camelCase"/);
  });

  it('Interface field name Mid_Underscore gives a warning', () => {
    const test = ` interface SentanceCase { id: ID! Mid_Underscore: String }
      ${tokenTypeDef}`;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.deep.match(/should be in "camelCase"/);
  });
});
