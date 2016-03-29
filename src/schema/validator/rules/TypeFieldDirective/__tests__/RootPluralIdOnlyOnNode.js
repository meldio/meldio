import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
  tokenTypeDef
} from '../../../__tests__/setup';

import { RootPluralIdOnlyOnNode as rule } from '../RootPluralIdOnlyOnNode';

describe('Schema Validation: TypeFieldDirective / RootPluralIdOnlyOnNode: ',
() => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Throws if @rootPluralId is on a type that is not Node', () => {
    const test = `
      type Foo {
        id: ID!
        name: String @rootPluralId(field: "fooByName")
      }
      ${tokenTypeDef}
    `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /cannot be defined on "Foo" type because "Foo" does not implement Node/);
  });

  it('Okay if @rootPluralId is on a Node type', () => {
    const test = `
      type Foo implements Node {
        id: ID!
        name: String @rootPluralId(field: "fooByName")
      }
    `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });
});
