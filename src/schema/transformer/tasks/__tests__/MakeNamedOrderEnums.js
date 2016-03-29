import { expect } from 'chai';
import { describe, it } from 'mocha';
import { runTest, stripMargin } from '../../__tests__/setup';

describe('AST Transformer / visitor / MakeNamedOrderEnums: ', () => {
  it('Makes ConnectionOrderKeys and ListOrderKeys enums', () => {
    const result = runTest(`
      order on NodeConnection(Foo, Bar) {
        FOO: [{ node: { foo: ASCENDING } }]
        BAR: [{ node: { foo: DESCENDING } }]
      }
      order on ScalarConnection(String, Bar) {
        BAR: [{ node: ASCENDING }]
      }
      order on ObjectConnection(Obj, Bar) {
        ASC: [{ bar: ASCENDING }]
        DES: [{ bar: DESCENDING }]
      }
      order on [Foo] {
        FOO: [{ foo: ASCENDING }]
        BAR: [{ foo: DESCENDING }]
      }
      order on [Obj] {
        FOO: [{ value: ASCENDING }]
        BAR: [{ value: DESCENDING }]
      }
    `);
    expect(result).to.contain(
      stripMargin`enum _Foo_Bar_ConnectionOrderKeys {
                 |  FOO
                 |  BAR
                 |}`);

    expect(result).to.contain(
      stripMargin`enum _String_Bar_ConnectionOrderKeys {
                 |  BAR
                 |}`);
    expect(result).to.contain(
      stripMargin`enum _Obj_Bar_ConnectionOrderKeys {
                 |  ASC
                 |  DES
                 |}`);

    expect(result).to.contain(
      stripMargin`enum _Foo_ListOrderKeys {
                 |  FOO
                 |  BAR
                 |}`);

    expect(result).to.contain(
      stripMargin`enum _Obj_ListOrderKeys {
                 |  FOO
                 |  BAR
                 |}`);
  });
});
