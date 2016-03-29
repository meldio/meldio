import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
  tokenTypeDef,
  TYPE_RESERVED_SUFFIXES
} from '../../../__tests__/setup';

import { NameSuffixIsNotReserved as rule } from '../NameSuffixIsNotReserved';

describe('Schema Validation: InputObject / NameSuffixIsNotReserved: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  TYPE_RESERVED_SUFFIXES.forEach(suffix =>
    it(`Input object name cannot end with ${suffix}`, () => {
      const test = ` input Foo${suffix} { id: ID! } ${tokenTypeDef}`;
      const result = runTest(test);
      const { errors } = separateResults(result);
      expect(errors).to.have.length(1);
      expect(errors).to.deep.match(/following suffixes are reserved/);
    }));
});
