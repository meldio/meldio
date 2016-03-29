import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
  tokenTypeDef,
  ARGUMENT_RESERVED_WORDS,
} from '../../../__tests__/setup';

import { NameIsNotReserved as rule } from '../NameIsNotReserved';

describe('Schema Validation: FilterConditionArgument / NameIsNotReserved: ',
() => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  ARGUMENT_RESERVED_WORDS
    .forEach(word =>
      it(`Argument name cannot be ${word}`, () => {
        const test = `
          filter on [String] {
            VALUE: (${word}: String) { eq: $${word} }
          } ${tokenTypeDef}`;
        const result = runTest(test);
        const { errors } = separateResults(result);
        expect(errors).to.have.length(1);
        expect(errors).to.deep.match(/following names are reserved/);
      }));
});
