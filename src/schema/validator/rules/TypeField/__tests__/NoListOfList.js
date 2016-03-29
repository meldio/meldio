import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
  okListTypes,
  badListTypes,
} from '../../../__tests__/setup';

import { NoListOfList as rule } from '../NoListOfList';

describe('Schema Validation: TypeField / NoListOfList: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  okListTypes.forEach(word =>
    it(`Field can be a list like this ${word}`, () => {
      const test = `
        enum Enum { ONE, TWO, THREE }
        interface Inteface { id: ID! }
        type Object implements Node, Interface { id: ID!, list: ${word} }
        type AnotherObject { foo: String }
        type YetAnotherObject { foo: String }
        union Union = AnotherObject | YetAnotherObject`;
      const result = runTest(test);
      expect(result).to.have.length(0);
    }));

  badListTypes.forEach(word =>
    it(`Field can not be a list of list like this ${word}`, () => {
      const test = ` type Object implements Node { id: ID!, list: ${word} } `;
      const result = runTest(test);
      const { errors } = separateResults(result);
      expect(errors).to.deep.match(/list of list/);
    }));
});
