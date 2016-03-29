import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
  typesSetup,
} from '../../../__tests__/setup';

import { NoMixedUnions as rule } from '../NoMixedUnions';

describe('Schema Validation: Union / NoMixedUnions: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Union of types that all implement Node is okay', () => {
    const test = ` ${typesSetup}
      union OkayUnion = A | B | C | D `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Union of types that all don\'t implement Node is okay', () => {
    const test = ` ${typesSetup}
      union OkayUnion = W | X | Y | Z `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });

  it('Union cannot mix types that do and that don\'t implement Node', () => {
    const test = ` ${typesSetup}
      union OkayUnion = A | B | Y | Z `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(/cannot mix the two/);
  });

});
