import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
} from '../../../__tests__/setup';

import { RootViewerValidArgument as rule } from '../RootViewerValidArgument';

describe('Schema Validation: TypeDirective / RootViewerValidArgument: ',
() => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Throws if @rootViewer has no arguments', () => {
    const test = `
      type Foo implements Node @rootViewer
      {
        id: ID!
      }
    `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(/should have exactly one argument/);
  });

  it('Throws if @rootViewer has two arguments', () => {
    const test = `
      type Foo implements Node @rootViewer(field: "allFoos" a: 123)
      {
        id: ID!
      }
    `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(/should have exactly one argument/);
  });

  it('Throws if @rootViewer has one argument with wrong name', () => {
    const test = `
      type Foo implements Node @rootViewer(fields: "allFoos")
      {
        id: ID!
      }
    `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /should have argument "field" with a String value/);
  });

  it('Throws if @rootViewer has field argument with wrong type', () => {
    const test = `
      type Foo implements Node @rootViewer(field: 123)
      {
        id: ID!
      }
    `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /should have argument "field" with a String value/);
  });

  it('Throws if @rootViewer has field that is not unique', () => {
    const test = `
      type Foo implements Node @rootViewer(field: "foo")
      {
        id: ID!
      }
    `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(/not unique/);
  });

  it('Throws if two @rootViewer\'s share the same name', () => {
    const test = `
      type Foo implements Node @rootViewer(field: "allFoos")
      {
        id: ID!
      }

      type Bar implements Node @rootViewer(field: "allFoos")
      {
        id: ID!
      }
    `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(/not unique/);
  });

  it('Warns if @rootViewer field name is not in camelCase', () => {
    const test = `
      type Foo implements Node
      {
        id: ID!
      }

      type Bar implements Node @rootViewer(field: "all_Foos")
      {
        id: ID!
      }

      type Baz implements Node
      {
        id: ID!
      }
    `;
    const result = runTest(test);
    expect(result).to.have.length(1);
    expect(result[0].description).and.match(/field name in "camelCase"/);
  });

  it('All good if @rootViewer is valid', () => {
    const test = `
      type Foo implements Node @rootViewer(field: "viewer")
      {
        id: ID!
      }

      type Bar implements Node
      {
        id: ID!
      }

      type Baz implements Node
      {
        id: ID!
      }
    `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });
});
