import { expect } from 'chai';
import { describe, it } from 'mocha';
import { runTest } from '../../../__tests__/setup';

describe('AST Transformer / visitor / RemoveAllDirectives: ', () => {
  it('Directives are removed from definitions', () => {
    const result = runTest(`
      interface Named @rootConnection(field: "allNamed") {
        name: String!
      }

      type Foo implements Node, Named @rootConnection(field: "allFoos") {
        id: ID!
        name: String! @rootPluralId(field: "fooByName")
      }

      union Union = Foo @rootConnection(field: "allUnions")
    `);

    expect(result).to.not.contain('@rootPluralId')
      .and.not.contain('@rootConnection');
  });
});
