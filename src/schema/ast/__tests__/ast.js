import { expect } from 'chai';
import { describe, it } from 'mocha';
import { makeType, makeRequiredField, makeListInput } from '..';

describe('AST Builder', () => {
  it('Type that implements interfaces is created correctly', () => {
    const output = makeType('TestType', [ 'Node', 'Foo' ], [
      makeRequiredField('id', [ ], 'ID')
    ]);
    const expectedOutput = {
      kind: 'ObjectTypeDefinition',
      name: {
        kind: 'Name',
        value: 'TestType' },
      interfaces: [
        {
          kind: 'NamedType',
          name: {
            kind: 'Name',
            value: 'Node'
          }
        },
        {
          kind: 'NamedType',
          name: {
            kind: 'Name',
            value: 'Foo'
          }
        } ],
      fields: [ {
        kind: 'FieldDefinition',
        name: {
          kind: 'Name',
          value: 'id' },
        arguments: [ ],
        type: {
          kind: 'NonNullType',
          type: {
            kind: 'NamedType',
            name: {
              kind: 'Name',
              value: 'ID' }}}} ]};

    expect(output).to.deep.equal(expectedOutput);
  });

  it('List input value definition is created correctly', () => {
    const output = makeListInput('TestList', 'String');
    const expectedOutput = {
      kind: 'InputValueDefinition',
      name: {
        kind: 'Name',
        value: 'TestList'
      },
      type: {
        kind: 'ListType',
        type: {
          kind: 'NamedType',
          name: {
            kind: 'Name',
            value: 'String'
          }
        }
      }
    };
    expect(output).to.deep.equal(expectedOutput);
  });
});
