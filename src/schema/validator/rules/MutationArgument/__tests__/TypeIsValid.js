import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
  tokenTypeDef,
  inputOkFieldTypes,
  inputBadFieldTypes,
} from '../../../__tests__/setup';

import { TypeIsValid as rule } from '../TypeIsValid';

describe('Schema Validation: MutationArgument / TypeIsValid: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  inputOkFieldTypes.forEach(word =>
    it(`Mutation can have an argument of type ${word}`, () => {
      const test = `
        enum Enum { ONE, TWO, THREE }
        input Object { obj: String }
        mutation testM(id: ID!, arg: ${word}) {id: ID} ${tokenTypeDef} `;
      const result = runTest(test);
      expect(result).to.have.length(0);
    }));

  inputBadFieldTypes.forEach(word =>
    it(`Mutation can not have an argument of type ${word}`, () => {
      const test = `
        type Interface { obj: String }
        type Object implements Interface { obj: String }
        type Foo implements Node { id: ID! }
        union Union = Foo | Object
        mutation
          testMut(id: ID!, list: ${word}){ id: ID! } ${tokenTypeDef} `;
      const result = runTest(test);
      const { errors } = separateResults(result);
      expect(errors).to.deep.match(
        /Mutation "testMut" defines an argument "list" with an unsupported/);
    }));
});
