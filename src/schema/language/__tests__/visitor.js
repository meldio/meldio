/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import { expect } from 'chai';
import { describe, it } from 'mocha';
import { parse } from '../parser';
import { visit, BREAK } from '../visitor';


describe('Visitor', () => {
  it('allows for editing on enter', () => {

    const ast = parse(`
      type Foo {
        a: Int,
        b: String,
        c: Float
      } `, { noLocation: true });
    const editedAst = visit(ast, {
      enter(node) {
        if (node.kind === 'FieldDefinition' && node.name.value === 'b') {
          return null;
        }
      }
    });

    expect(ast).to.deep.equal(
      parse(`
        type Foo {
          a: Int,
          b: String,
          c: Float
        } `, { noLocation: true })
    );

    expect(editedAst).to.deep.equal(
      parse(`
        type Foo {
          a: Int,
          c: Float
        } `, { noLocation: true })
    );
  });

  it('allows for editing on leave', () => {

    const ast = parse(`
      type Foo {
        a: Int,
        b: String,
        c: Float
      } `, { noLocation: true });
    const editedAst = visit(ast, {
      leave(node) {
        if (node.kind === 'FieldDefinition' && node.name.value === 'b') {
          return null;
        }
      }
    });

    expect(ast).to.deep.equal(
      parse(`
        type Foo {
          a: Int,
          b: String,
          c: Float
        } `, { noLocation: true })
    );

    expect(editedAst).to.deep.equal(
      parse(`
        type Foo {
          a: Int,
          c: Float
        } `, { noLocation: true })
    );
  });

  it('visits edited node', () => {

    const addedField =
      { kind: 'FieldDefinition',
        name: { kind: 'Name', value: 'c' },
        type: {
          kind: 'NamedType',
          name: { kind: 'Name', value: 'Boolean' } } };

    let didVisitAddedField;

    const ast = parse(`
      type Test {
        a: Int
        b: Float
      }
    `);
    visit(ast, {
      enter(node) {
        if (node.kind === 'ObjectTypeDefinition' &&
            node.name.value === 'Test') {
          return {
            ...node,
            fields: node.fields.concat(addedField)
          };
        }
        if (node === addedField) {
          didVisitAddedField = true;
        }
      }
    });

    expect(didVisitAddedField).to.equal(true);
  });

  it('allows skipping a sub-tree', () => {

    const visited = [];

    const ast = parse(`
      type Test {
        a: Int
        b: Float
        c: Boolean
      }
    `);
    visit(ast, {
      enter(node) {
        visited.push([ 'enter', node.kind, node.value ]);
        if (node.kind === 'FieldDefinition' && node.name.value === 'b') {
          return false;
        }
      },

      leave(node) {
        visited.push([ 'leave', node.kind, node.value ]);
      }
    });

    expect(visited).to.deep.equal([
      [ 'enter', 'Document', undefined ],
      [ 'enter', 'ObjectTypeDefinition', undefined ],
      [ 'enter', 'Name', 'Test' ],
      [ 'leave', 'Name', 'Test' ],
      [ 'enter', 'FieldDefinition', undefined ],
      [ 'enter', 'Name', 'a' ],
      [ 'leave', 'Name', 'a' ],
      [ 'enter', 'NamedType', undefined ],
      [ 'enter', 'Name', 'Int' ],
      [ 'leave', 'Name', 'Int' ],
      [ 'leave', 'NamedType', undefined ],
      [ 'leave', 'FieldDefinition', undefined ],
      [ 'enter', 'FieldDefinition', undefined ],  // aborted enter here
      [ 'enter', 'FieldDefinition', undefined ],
      [ 'enter', 'Name', 'c' ],
      [ 'leave', 'Name', 'c' ],
      [ 'enter', 'NamedType', undefined ],
      [ 'enter', 'Name', 'Boolean' ],
      [ 'leave', 'Name', 'Boolean' ],
      [ 'leave', 'NamedType', undefined ],
      [ 'leave', 'FieldDefinition', undefined ],
      [ 'leave', 'ObjectTypeDefinition', undefined ],
      [ 'leave', 'Document', undefined ],
    ]);
  });

  it('allows early exit while visiting', () => {

    const visited = [];

    const ast = parse(`
      type Test {
        a: Int
        b: Float
        c: Boolean
      }
    `);
    visit(ast, {
      enter(node) {
        visited.push([ 'enter', node.kind, node.value ]);
        if (node.kind === 'Name' && node.value === 'b') {
          return BREAK;
        }
      },

      leave(node) {
        visited.push([ 'leave', node.kind, node.value ]);
      }
    });

    expect(visited).to.deep.equal([
      [ 'enter', 'Document', undefined ],
      [ 'enter', 'ObjectTypeDefinition', undefined ],
      [ 'enter', 'Name', 'Test' ],
      [ 'leave', 'Name', 'Test' ],
      [ 'enter', 'FieldDefinition', undefined ],
      [ 'enter', 'Name', 'a' ],
      [ 'leave', 'Name', 'a' ],
      [ 'enter', 'NamedType', undefined ],
      [ 'enter', 'Name', 'Int' ],
      [ 'leave', 'Name', 'Int' ],
      [ 'leave', 'NamedType', undefined ],
      [ 'leave', 'FieldDefinition', undefined ],
      [ 'enter', 'FieldDefinition', undefined ],
      [ 'enter', 'Name', 'b' ]  // aborted enter here
    ]);
  });

  it('allows a named functions visitor API', () => {

    const visited = [];

    const ast = parse(`
      type Test {
        a: Int
        b: Float
        c: Boolean
      } `);
    visit(ast, {
      Name(node) {
        visited.push([ 'enter', node.kind, node.value ]);
      },
      FieldDefinition: {
        enter(node) {
          visited.push([ 'enter', node.kind, node.value ]);
        },
        leave(node) {
          visited.push([ 'leave', node.kind, node.value ]);
        }
      }
    });

    expect(visited).to.deep.equal([
      [ 'enter', 'Name', 'Test' ],
      [ 'enter', 'FieldDefinition', undefined ],
      [ 'enter', 'Name', 'a' ],
      [ 'enter', 'Name', 'Int' ],
      [ 'leave', 'FieldDefinition', undefined ],
      [ 'enter', 'FieldDefinition', undefined ],
      [ 'enter', 'Name', 'b' ],
      [ 'enter', 'Name', 'Float' ],
      [ 'leave', 'FieldDefinition', undefined ],
      [ 'enter', 'FieldDefinition', undefined ],
      [ 'enter', 'Name', 'c' ],
      [ 'enter', 'Name', 'Boolean' ],
      [ 'leave', 'FieldDefinition', undefined ],
    ]);
  });

});
