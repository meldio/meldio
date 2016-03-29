import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
  TYPE_RESERVED_SUFFIXES
} from '../../../__tests__/setup';

import { NameSuffixIsNotReserved as rule } from '../NameSuffixIsNotReserved';

describe('Schema Validation: Type / NameSuffixIsNotReserved: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  TYPE_RESERVED_SUFFIXES.forEach(suffix =>
    it(`Type name cannot end with ${suffix}`, () => {
      const test = ` type Foo${suffix} implements Node { id: ID! } `;
      const result = runTest(test);
      const { errors } = separateResults(result);
      expect(errors).to.deep.match(/Type name ".*" cannot end with ".*"/);
    }));
});
