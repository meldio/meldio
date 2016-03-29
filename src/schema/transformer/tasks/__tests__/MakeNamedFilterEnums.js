import { expect } from 'chai';
import { describe, it } from 'mocha';
import { runTest, stripMargin } from '../../__tests__/setup';

describe('AST Transformer / visitor / MakeNamedFilterEnums: ', () => {
  it('Makes ConnectionFilterKeys and ListFilterKeys enums', () => {
    const result = runTest(`
      filter on NodeConnection(Foo, Bar) {
        FOO: { node: { foo: { eq: "foo" } } }
      }
      filter on ScalarConnection(String, Bar) {
        BAR: { node: { eq: "bar" } }
      }
      filter on ObjectConnection(Obj, Bar) {
        BAR: { bar: { eq: "bar" } }
      }
      filter on [Foo] {
        FOO: (foo: String) { foo: { eq: $foo } }
      }
      filter on [Obj] {
        FOO: (value: String) { value: { eq: $value } }
      }
      filter on [String] {
        VALUE: (value: String) { eq: $value }
      }
      filter on [Int] {
        VALUE: (value: Int) { eq: $value }
      }
      filter on [Boolean] {
        VALUE: (value: Boolean) { eq: $value }
        TRUE: { eq: true }
        FALSE: { eq: false }
      }
    `);
    expect(result).to.contain(
      stripMargin`enum _Foo_Bar_ConnectionFilterKeys {
                 |  FOO
                 |}`);

    expect(result).to.contain(
      stripMargin`enum _String_Bar_ConnectionFilterKeys {
                 |  BAR
                 |}`);
    expect(result).to.contain(
      stripMargin`enum _Obj_Bar_ConnectionFilterKeys {
                 |  BAR
                 |}`);

    expect(result).to.contain(
      stripMargin`enum _Foo_ListFilterKeys {
                 |  FOO
                 |}`);

    expect(result).to.contain(
      stripMargin`enum _Obj_ListFilterKeys {
                 |  FOO
                 |}`);




    expect(result).to.contain(
      stripMargin`enum _String_ListFilterKeys {
                 |  VALUE
                 |}`);

    expect(result).to.contain(
      stripMargin`enum _Int_ListFilterKeys {
                 |  VALUE
                 |}`);

    expect(result).to.contain(
      stripMargin`enum _Boolean_ListFilterKeys {
                 |  VALUE
                 |  TRUE
                 |  FALSE
                 |}`);
  });
});
