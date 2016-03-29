import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
} from '../../../__tests__/setup';

import {RootPluralIdValidArgument as rule} from '../RootPluralIdValidArgument';

describe('Schema Validation: TypeDirective /RootPluralIdValidArgument:', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Throws if @rootPluralId has no arguments', () => {
    const test = `
      type Foo implements Node
      {
        id: ID!
        name: String @rootPluralId
      }
    `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(/should have exactly one argument/);
  });

  it('Throws if @rootPluralId has two arguments', () => {
    const test = `
      type Foo implements Node
      {
        id: ID!
        name: String @rootPluralId(field: "allFoos" a: 123)
      }
    `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(/should have exactly one argument/);
  });

  it('Throws if @rootPluralId has one argument with wrong name', () => {
    const test = `
      type Foo implements Node
      {
        id: ID!
        name: String @rootPluralId(fields: "allFoos")
      }
    `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /should have argument "field" with a String value/);
  });

  it('Throws if @rootPluralId has field argument with wrong type', () => {
    const test = `
      type Foo implements Node
      {
        id: ID!
        name: String @rootPluralId(field: 123)
      }
    `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /should have argument "field" with a String value/);
  });

  it('Throws if @rootPluralId has field that is not unique', () => {
    const test = `
      type Foo implements Node
      {
        id: ID!
        name: String @rootPluralId(field: "foo")
      }
    `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(/is not unique/);
  });

  it('Throws if two @rootPluralId\'s share the same name', () => {
    const test = `
      type Foo implements Node
      {
        id: ID!
        name: String @rootPluralId(field: "allFoos")
      }

      type Bar implements Node
      {
        id: ID!
        name: String @rootPluralId(field: "allFoos")
      }
    `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(/is not unique/);
  });

  it('Warns if @rootPluralId field name is not in camelCase', () => {
    const test = `
      type Foo implements Node
      {
        id: ID!
        name: String @rootPluralId(field: "AllFoos")
      }

      type Bar implements Node
      {
        id: ID!
        name: String @rootPluralId(field: "all_Foos")
      }

      type Baz implements Node
      {
        id: ID!
        name: String @rootPluralId(field: "_allFoos")
      }
    `;
    const result = runTest(test);
    expect(result).to.have.length(3);
    expect(result[0].description).to.match(/specify field name in "camelCase"/);
    expect(result[1].description).to.match(/specify field name in "camelCase"/);
    expect(result[2].description).to.match(/specify field name in "camelCase"/);
  });

  it('All good if @rootPluralId is valid', () => {
    const test = `
      type Foo implements Node
      {
        id: ID!
        name: String @rootPluralId(field: "fooByName")
      }

      type Bar implements Node
      {
        id: ID!
        name: String @rootPluralId(field: "barByName")
      }

      type Baz implements Node
      {
        id: ID!
        name: String @rootPluralId(field: "bazByName")
      }
    `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });
});
