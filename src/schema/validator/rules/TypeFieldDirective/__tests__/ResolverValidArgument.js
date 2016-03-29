import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  runTest,
  separateResults,
} from '../../../__tests__/setup';

import { ResolverValidArgument as rule } from '../ResolverValidArgument';

describe('Schema Validation: TypeDirective / ResolverValidArgument: ', () => {
  it('Rule throws if appropriate context is not passed',() => {
    expect(rule.bind(null, { })).to.throw(Error, /context not passed to rule/);
  });

  it('Throws if @resolver has no arguments', () => {
    const test = `
      type Foo implements Node
      {
        id: ID!
        name: String @resolver
      }
    `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(/should have exactly one argument/);
  });

  it('Throws if @resolver has two arguments', () => {
    const test = `
      type Foo implements Node
      {
        id: ID!
        name: String @resolver(function: "calcName" a: 123)
      }
    `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(/should have exactly one argument/);
  });

  it('Throws if @resolver has one argument with wrong name', () => {
    const test = `
      type Foo implements Node
      {
        id: ID!
        name: String @resolver(func: "calcName")
      }
    `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /should have argument "function" with a String value/);
  });

  it('Throws if @resolver has field argument with wrong type', () => {
    const test = `
      type Foo implements Node
      {
        id: ID!
        name: String @resolver(function: 123)
      }
    `;
    const result = runTest(test);
    const { errors } = separateResults(result);
    expect(errors).to.deep.match(
      /should have argument "function" with a String value/);
  });

  it('All good if @resolver is valid', () => {
    const test = `
      type Foo implements Node
      {
        id: ID!
        name: String @resolver(function: "calcName")
      }

      type Bar
      {
        id: ID!
        name: String @resolver(function: "calcName")
      }
    `;
    const result = runTest(test);
    expect(result).to.have.length(0);
  });
});
