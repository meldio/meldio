import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
  tokenTypeDef,
  FIELD_RESERVED_WORDS,
} from '../../../__tests__/setup';

import { NameIsNotReserved as rule } from '../NameIsNotReserved';

describe('Schema Validation: InterfaceField / NameIsNotReserved: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  FIELD_RESERVED_WORDS.forEach(word =>
    it(`Interface field name cannot be ${word}`, () => {
      const test = ` interface Foo { ${word}: Int } ${tokenTypeDef}`;
      const result = runTest(test);
      const { errors } = separateResults(result);
      expect(errors).to.deep.match(/Field name .* of interface .* is reserved/);
    }));
});
