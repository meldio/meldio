import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
  FIELD_RESERVED_WORDS
} from '../../../__tests__/setup';

import { NameIsNotReserved as rule } from '../NameIsNotReserved';

describe('Schema Validation: TypeField / NameIsNotReserved: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  FIELD_RESERVED_WORDS.forEach(word =>
    it(`Type field name cannot be ${word}`, () => {
      const test = ` type Foo implements Node { id: ID! ${word}: Int } `;
      const result = runTest(test);
      const { errors } = separateResults(result);
      expect(errors).to.deep.match(/is reserved/);
    }));
});
