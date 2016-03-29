import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
  tokenTypeDef,
  inputOkListTypes,
  badListTypes
} from '../../../__tests__/setup';

import { NoListOfList as rule } from '../NoListOfList';

describe('Schema Validation: InputObjectField / NoListOfList: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  inputOkListTypes.forEach(word =>
    it(`Input object can be a list like this ${word}`, () => {
      const test = `
        enum Enum { ONE, TWO, THREE }
        input Object { obj: String }
        input Test { id: ID!, list: ${word} } ${tokenTypeDef} `;
      const result = runTest(test);
      expect(result).to.have.length(0);
    }));

  badListTypes.forEach(word =>
    it(`Input object can not be a list of list like this ${word}`, () => {
      const test = `
        input Object { obj: String }
        input Test { id: ID!, list: ${word} } ${tokenTypeDef} `;
      const result = runTest(test);
      const { errors } = separateResults(result);
      expect(errors).to.have.length(2);
      expect(errors).to.deep.match(/list of list/);
    }));
});
