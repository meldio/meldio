import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
  tokenTypeDef,
  TYPE_RESERVED_WORDS,
} from '../../../__tests__/setup';

import { NameIsNotReserved as rule } from '../NameIsNotReserved';

describe('Schema Validation: Interface / NameIsNotReserved: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  TYPE_RESERVED_WORDS.forEach(word =>
    it(`Interface name cannot be ${word}`, () => {
      const test = ` interface ${word} { id: ID! } ${tokenTypeDef}`;
      const result = runTest(test);
      const { errors } = separateResults(result);
      expect(errors).to.have.length(1);
      expect(errors).to.deep.match(/following names are reserved/);
    }));
});
