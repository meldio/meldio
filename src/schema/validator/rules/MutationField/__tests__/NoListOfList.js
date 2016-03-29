import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
  tokenTypeDef,
  okListTypes,
  badListTypes,
} from '../../../__tests__/setup';

import { NoListOfList as rule } from '../NoListOfList';

describe('Schema Validation: MutationField / NoListOfList: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  okListTypes.forEach(word =>
    it(`Mutation field can be a list like this ${word}`, () => {
      const test = `
      enum Enum { ONE, TWO, THREE }
      interface Inteface { id: ID! }
      type AnotherObject { foo: String }
      type YetAnotherObject { foo: String }
      union Union = AnotherObject | YetAnotherObject
      mutation test(id: ID!){ id: ID!,  list: ${word} } ${tokenTypeDef}`;
      const result = runTest(test);
      expect(result).to.have.length(0);
    }));

  badListTypes.forEach(word =>
    it(`Mutation field can not be a list of list like this ${word}`, () => {
      const test = `
        input Object { obj: String }
        mutation test(id: ID!){ id: ID, list: ${word} } ${tokenTypeDef}`;
      const result = runTest(test);
      const { errors } = separateResults(result);
      expect(errors).to.deep.match(
        /list of list, which is currently not supported/);
    }));
});
