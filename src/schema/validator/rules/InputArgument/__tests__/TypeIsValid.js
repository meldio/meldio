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

describe('Schema Validation: InputObjectField / TypeIsValid: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  inputOkFieldTypes.forEach(word =>
    it(`Input object can have a field of type ${word}`, () => {
      const test = `
        enum Enum { ONE, TWO, THREE }
        input Object { obj: String }
        input Test { id: ID!, arg: ${word} } ${tokenTypeDef} `;
      const result = runTest(test);
      expect(result).to.have.length(0);
    }));

  inputBadFieldTypes.forEach(word =>
    it(`Input object can not have a field of type ${word}`, () => {
      const test = `
        type Interface { obj: String }
        type Object implements Interface { obj: String }
        type Foo implements Node { id: ID! }
        type Bar implements Node { id: ID! }
        union Union = Foo | Bar
        input Test { id: ID!, list: ${word} } ${tokenTypeDef} `;
      const result = runTest(test);
      const { errors } = separateResults(result);
      expect(errors).to.have.length(1);
      expect(errors).to.deep.match(/unsupported type/);
    }));
});
