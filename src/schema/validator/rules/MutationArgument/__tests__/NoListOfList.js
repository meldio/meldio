import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
  tokenTypeDef,
  inputOkListTypes,
  badListTypes,
} from '../../../__tests__/setup';

import { NoListOfList as rule } from '../NoListOfList';

describe('Schema Validation: MutationArgument / NoListOfList: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  inputOkListTypes.forEach(word =>
    it(`Mutation arguments can be a list like this ${word}`, () => {
      const test = `
      enum Enum { ONE, TWO, THREE }
      input Object { obj: String }
      mutation test(id: ID!, list: ${word}){ id: ID! } ${tokenTypeDef} `;

      const result = runTest(test);
      expect(result).to.have.length(0);
    }));

  badListTypes.forEach(word =>
    it(`Mutation arguments can not be a list of list like this ${word}`, () => {
      const test = `
      input Object { obj: String }
      mutation test(id: ID!, list: ${word}){ id: ID } ${tokenTypeDef} `;

      const result = runTest(test);
      const { errors } = separateResults(result);
      expect(errors).to.deep.match(
        /list of list, which is currently not supported/);
    }));
});
