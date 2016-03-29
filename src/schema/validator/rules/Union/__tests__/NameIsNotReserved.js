import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
  tokenTypeDef,
  unionedTypes,
  TYPE_RESERVED_WORDS,
} from '../../../__tests__/setup';

import { NameIsNotReserved as rule } from '../NameIsNotReserved';

describe('Schema Validation: Union / NameIsNotReserved: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  TYPE_RESERVED_WORDS.forEach(word =>
    it(`Union name cannot be ${word}`, () => {
      const test = `
        ${unionedTypes}
        union ${word} = Foo | Bar
        ${tokenTypeDef} `;

      const result = runTest(test);
      const { errors } = separateResults(result);
      expect(errors).to.deep.match(/is reserved/);
    }));
});
