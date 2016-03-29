import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
} from '../../../__tests__/setup';

import { RootConnectionValidArgument as rule }
  from '../RootConnectionValidArgument';

describe('Schema Validation: TypeDirective / RootConnectionValidArgument: ',
() => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Throws if @rootConnection has no field argument', () => {
    const test = `
      type Foo implements Node @rootConnection
      {
        id: ID!
      }
    `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(/must have argument "field"/);
  });

  it('Throws if @rootConnection has an invalid argument', () => {
    const test = `
      type Foo implements Node @rootConnection(field: "allFoos" filter: 123)
      {
        id: ID!
      }
    `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /specifies an invalid argument\(s\): "filter"/);
  });

  it('Throws if @rootConnection has field argument with wrong type', () => {
    const test = `
      type Foo implements Node @rootConnection(field: 123)
      {
        id: ID!
      }
    `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /must have argument "field" with a String value/);
  });

  it('Throws if @rootConnection has field that is not unique', () => {
    const test = `
      type Foo implements Node @rootConnection(field: "foo")
      {
        id: ID!
      }
    `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(/not unique/);
  });

  it('Throws if two @rootConnection\'s share the same name', () => {
    const test = `
      type Foo implements Node @rootConnection(field: "allFoos")
      {
        id: ID!
      }

      type Bar implements Node @rootConnection(field: "allFoos")
      {
        id: ID!
      }
    `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(/not unique/);
  });

  it('Warns if @rootConnection field name is not in camelCase', () => {
    const test = `
      type Foo implements Node @rootConnection(field: "AllFoos")
      {
        id: ID!
      }

      type Bar implements Node @rootConnection(field: "all_Foos")
      {
        id: ID!
      }

      type Baz implements Node @rootConnection(field: "_allFoos")
      {
        id: ID!
      }
    `;
    const result = runTest(test);
    const { warnings } = separateResults(result);
    expect(warnings).to.have.length(3);
    expect(warnings).to.deep.match(/field name in "camelCase"/);
  });

});
