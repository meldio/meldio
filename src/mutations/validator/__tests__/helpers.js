import { expect } from 'chai';
import { describe, it } from 'mocha';
import { parse, analyzeAST, validate } from '../../../schema';
import {
  isValidNodeId,
  isValidNodeIdList,
  isValidScalar,
  isValidScalarList,
  hasOp,
  allowedOps,
  typeOp,
  scalarListOp,
  scalarOp,
  scalarOpVal,
  atMostOneOp,
  nodeIdListOp,
} from '../helpers';

const schemaDefinition = `
  enum MyEnum { VALID_ONE VALID_TWO }

  type SimpleObj {
    name: String!
    int: Int
  }

  interface Baz {
    name: String
  }

  union Union = SimpleObj
  union FoosUnion = Foo

  interface FoosInt {
    cost: Int
  }

  type Foo implements Node, FoosInt {
    id: ID!
    cost: Int
  }
`;

const ast = parse(schemaDefinition);
const schema = analyzeAST(ast);
const validationResult = validate(schema);


describe('mutations / validator / validateField', () => {
  it('test schema is valid', () => {
    expect(validationResult).to.have.length(0);
  });

  it('isValidNodeId returns true if nodeId is nullish', () => {
    expect(isValidNodeId(schema, 'Foo', null)).to.equal(true);
  });

  it('isValidNodeId returns false if nodeId is int', () => {
    expect(isValidNodeId(schema, 'Foo', 123)).to.equal(false);
  });

  it('isValidNodeId returns false if nodeId length <= 21 ', () => {
    expect(isValidNodeId(schema, 'Foo', '12345678901234567890-'))
      .to.equal(false);
  });

  it('isValidNodeId returns false if type does not exist', () => {
    expect(isValidNodeId(schema, 'Bar', '-K93P_dtfKN9wEt699ND-WFF'))
      .to.equal(false);
  });

  it('isValidNodeId returns false if type is not type, interface or union',
  () => {
    expect(isValidNodeId(schema, 'MyEnum', '-K93Pz7pRjDsOcEjfHAA-cPVELD'))
      .to.equal(false);
  });

  it('isValidNodeId returns false if type is does not match id', () => {
    expect(isValidNodeId(schema, 'SimpleObj', '-K93P_dtfKN9wEt699ND-WFF'))
      .to.equal(false);
  });

  it('isValidNodeId returns false if interface does not implement id type',
  () => {
    expect(isValidNodeId(schema, 'Baz', '-K93P_dtfKN9wEt699ND-WFF'))
      .to.equal(false);
  });

  it('isValidNodeId returns false if union does not include id type', () => {
    expect(isValidNodeId(schema, 'Union', '-K93P_dtfKN9wEt699ND-WFF'))
      .to.equal(false);
  });

  it('isValidNodeId returns true if id is valid and type is passed', () => {
    expect(isValidNodeId(schema, 'Foo', '-K93P_dtfKN9wEt699ND-WFF'))
      .to.equal(true);
  });

  it('isValidNodeId returns true if id is valid and interf is passed', () => {
    expect(isValidNodeId(schema, 'FoosInt', '-K93P_dtfKN9wEt699ND-WFF'))
      .to.equal(true);
  });

  it('isValidNodeId returns true if id is valid and union is passed', () => {
    expect(isValidNodeId(schema, 'FoosUnion', '-K93P_dtfKN9wEt699ND-WFF'))
      .to.equal(true);
  });

  it('isValidNodeIdList returns false if list is not passed', () => {
    expect(isValidNodeIdList(schema, 'Foo', 123)).to.equal(false);
  });

  it('isValidNodeIdList returns true if empty list is passed', () => {
    expect(isValidNodeIdList(schema, 'Foo', [ ])).to.equal(true);
  });

  it('isValidNodeIdList returns true if correct list is passed', () => {
    expect(isValidNodeIdList(schema, 'Foo', [ '-K93P_dtfKN9wEt699ND-WFF' ]))
      .to.equal(true);
  });

  it('isValidNodeIdList returns false if invalid list is passed', () => {
    expect(isValidNodeIdList(schema, 'Foo', [ '-WFF' ])).to.equal(false);
  });

  it('isValidScalar validates String correctly', () => {
    expect(isValidScalar(schema, 'String', 123)).to.equal(false);
    expect(isValidScalar(schema, 'String', '123')).to.equal(true);
  });

  it('isValidScalar validates Int correctly', () => {
    expect(isValidScalar(schema, 'Int', 123)).to.equal(true);
    expect(isValidScalar(schema, 'Int', '123')).to.equal(false);
  });

  it('isValidScalar validates Float correctly', () => {
    expect(isValidScalar(schema, 'Float', 123.12)).to.equal(true);
    expect(isValidScalar(schema, 'Float', '123.12')).to.equal(false);
  });

  it('isValidScalar validates Boolean correctly', () => {
    expect(isValidScalar(schema, 'Boolean', true)).to.equal(true);
    expect(isValidScalar(schema, 'Boolean', false)).to.equal(true);
    expect(isValidScalar(schema, 'Boolean', null)).to.equal(false);
    expect(isValidScalar(schema, 'Boolean', 1)).to.equal(false);
    expect(isValidScalar(schema, 'Boolean', 0)).to.equal(false);
  });

  it('isValidScalar validates ID correctly', () => {
    expect(isValidScalar(schema, 'ID', 123)).to.equal(false);
    expect(isValidScalar(schema, 'ID', '123')).to.equal(true);
  });

  it('isValidScalar validates Enum correctly', () => {
    expect(isValidScalar(schema, 'MyEnum', 'VALID_THREE')).to.equal(false);
    expect(isValidScalar(schema, 'MyEnum', 'VALID_ONE')).to.equal(true);
  });

  it('isValidScalar returns false if type is not a scalar', () => {
    expect(isValidScalar(schema, 'Foo', { })).to.equal(false);
  });

  it('isValidScalarList returns false if list is not passed', () => {
    expect(isValidScalarList(schema, 'String', 123)).to.equal(false);
  });

  it('isValidScalarList returns true if empty list is passed', () => {
    expect(isValidScalarList(schema, 'String', [ ])).to.equal(true);
  });

  it('isValidScalarList returns true if correct list is passed', () => {
    expect(isValidScalarList(schema, 'String', [ 'foo' ]))
      .to.equal(true);
  });

  it('isValidScalarList returns false if invalid list is passed', () => {
    expect(isValidScalarList(schema, 'String', [ 123 ])).to.equal(false);
  });

  it('hasOp returns false if expression is not an object', () => {
    expect(hasOp('foo', 123)).to.equal(false);
  });

  it('hasOp returns false if expression is an array', () => {
    expect(hasOp('foo', [ ])).to.equal(false);
  });

  it('hasOp returns false if expression is an object without the key', () => {
    expect(hasOp('foo', { })).to.equal(false);
  });

  it('hasOp returns true if expression is an object with the key', () => {
    expect(hasOp('foo', { foo: true })).to.equal(true);
  });


  it('allowedOps returns an error if expression is not an object ', () => {
    const allowed = [ 'foo', 'bar', 'baz' ];
    const path = '[PATH]';
    const opts = { prefix: '[PREFIX]', suffix: '[SUFFIX]' };

    expect(allowedOps(123, allowed, path, opts)).to.deep.equal(
      [ `[PREFIX] has a scalar value where object is expected [SUFFIX]. ` +
        `Only object expressions are allowed in this context.` ]);
  });

  it('allowedOps returns an error if expression is an array', () => {
    const allowed = [ 'foo', 'bar', 'baz' ];
    const path = '[PATH]';
    const opts = { prefix: '[PREFIX]', suffix: '[SUFFIX]' };

    expect(allowedOps([ 123 ], allowed, path, opts)).to.deep.equal(
      [ `[PREFIX] has an array where object is expected [SUFFIX]. ` +
        `Only object expressions are allowed in this context.` ]);
  });

  it('allowedOps returns an error if expression has an invalid key', () => {
    const allowed = [ 'foo', 'bar', 'baz' ];
    const path = '[PATH]';
    const opts = { prefix: '[PREFIX]', suffix: '[SUFFIX]' };

    expect(allowedOps({zaz: true, kaz: 1}, allowed, path, opts)).to.deep.equal(
      [ `[PREFIX] has an invalid "zaz" operator [SUFFIX]. ` +
        `Allowed operators are: "foo", "bar", "baz".`,
        `[PREFIX] has an invalid "kaz" operator [SUFFIX]. ` +
        `Allowed operators are: "foo", "bar", "baz".` ]);
  });

  it('allowedOps returns empty list if expression has only valid keys', () => {
    const allowed = [ 'foo', 'bar', 'baz' ];
    const path = '[PATH]';
    const opts = { prefix: '[PREFIX]', suffix: '[SUFFIX]' };

    expect(allowedOps({foo: 1, bar: 2, baz: 3}, allowed, path, opts))
      .to.deep.equal([]);
  });

  it('typeOp returns empty list if expression does not mention type', () => {
    const allowed = [ 'a', 'b', 'c' ];
    const path = '[PATH]';
    const opts = { prefix: '[PREFIX]' };

    expect(typeOp(schema, allowed, { }, path, opts))
      .to.deep.equal([ ]);
  });

  it('typeOp returns error if type exp is not valid scalar or list', () => {
    const allowed = [ 'a', 'b', 'c' ];
    const path = '[PATH]';
    const opts = { prefix: '[PREFIX]' };

    expect(typeOp(schema, allowed, { type: 123 }, path, opts))
      .to.deep.equal([
        `[PREFIX] has an invalid value within "[PATH]" subexpression. ` +
        `Expected "String" array or scalar of: "a", "b", "c".`
      ]);

    expect(typeOp(schema, allowed, { type: [ 123 ] }, path, opts))
      .to.deep.equal([
        `[PREFIX] has an invalid value within "[PATH]" subexpression. ` +
        `Expected "String" array or scalar of: "a", "b", "c".`
      ]);
  });

  it('typeOp returns error if type exp has an invalid type', () => {
    const allowed = [ 'a', 'b', 'c' ];
    const path = '[PATH]';
    const opts = { prefix: '[PREFIX]' };

    expect(typeOp(schema, allowed, { type: 'x' }, path, opts))
      .to.deep.equal([
        `[PREFIX] has invalid type name within "[PATH]" subexpression. ` +
        `Expected "String" array or scalar of: "a", "b", "c".`
      ]);

    expect(typeOp(schema, allowed, { type: [ 'a', 'x' ] }, path, opts))
      .to.deep.equal([
        `[PREFIX] has invalid type name within "[PATH]" subexpression. ` +
        `Expected "String" array or scalar of: "a", "b", "c".`
      ]);
  });

  it('typeOp returns error if type exp has an invalid operator', () => {
    const allowed = [ 'a', 'b', 'c' ];
    const path = '[PATH]';
    const opts = { prefix: '[PREFIX]' };

    expect(typeOp(schema, allowed, { type: { lt: 'c' } }, path, opts))
      .to.deep.equal([
        `[PREFIX] has an invalid "lt" operator within "[PATH]" ` +
        `subexpression. Allowed operators are: "eq", "ne".`
      ]);
  });

  it('typeOp returns error if eq or ne ops reference an invalid type', () => {
    const allowed = [ 'a', 'b', 'c' ];
    const path = '[PATH]';
    const opts = { prefix: '[PREFIX]' };

    expect(typeOp(schema, allowed, { type: { eq: 'x' } }, path, opts))
      .to.deep.equal([
        `[PREFIX] has invalid "eq" operator value within "[PATH]" ` +
        `subexpression. Expected "String" array or scalar of: "a", "b", "c".`
      ]);

    expect(typeOp(schema, allowed, { type: { eq: [ 'a', 'x' ] } }, path, opts))
      .to.deep.equal([
        `[PREFIX] has invalid "eq" operator value within "[PATH]" ` +
        `subexpression. Expected "String" array or scalar of: "a", "b", "c".`
      ]);

    expect(typeOp(schema, allowed, { type: { ne: 'x' } }, path, opts))
      .to.deep.equal([
        `[PREFIX] has invalid "ne" operator value within "[PATH]" ` +
        `subexpression. Expected "String" array or scalar of: "a", "b", "c".`
      ]);

    expect(typeOp(schema, allowed, { type: { ne: [ 'a', 'x' ] } }, path, opts))
      .to.deep.equal([
        `[PREFIX] has invalid "ne" operator value within "[PATH]" ` +
        `subexpression. Expected "String" array or scalar of: "a", "b", "c".`
      ]);
  });

  it('typeOp returns empty list if eq or ne ops reference valid types', () => {
    const allowed = [ 'a', 'b', 'c' ];
    const path = '[PATH]';
    const opts = { prefix: '[PREFIX]' };

    expect(typeOp(schema, allowed, { type: { eq: 'a' } }, path, opts))
      .to.deep.equal([ ]);

    expect(typeOp(schema, allowed, {type: {eq: [ 'a', 'b', 'c' ]}}, path, opts))
      .to.deep.equal([ ]);

    expect(typeOp(schema, allowed, { type: { ne: 'b' } }, path, opts))
      .to.deep.equal([ ]);

    expect(typeOp(schema, allowed, {type: {ne: [ 'a', 'b', 'c' ]}}, path, opts))
      .to.deep.equal([ ]);
  });

  it('scalarListOp returns empty list if exp is not object or is array', () => {
    const opts = { prefix: '[PREFIX]', suffix: '[SUFFIX]' };
    expect(scalarListOp(schema, 'foo', 'String', 123, opts))
      .to.deep.equal([ ]);
    expect(scalarListOp(schema, 'foo', 'String', [ 123 ], opts))
      .to.deep.equal([ ]);
  });

  it('scalarListOp returns empty list if op is not in expression', () => {
    const opts = { prefix: '[PREFIX]', suffix: '[SUFFIX]' };
    expect(scalarListOp(schema, 'foo', 'String', { }, opts))
      .to.deep.equal([ ]);
    expect(scalarListOp(schema, 'foo', 'String', { bar: true }, opts))
      .to.deep.equal([ ]);
  });

  it('scalarListOp returns error if op is not a valid scalar', () => {
    const opts = { prefix: '[PREFIX]', suffix: '[SUFFIX]' };
    expect(scalarListOp(schema, 'foo', 'String', { foo: 123 }, opts))
      .to.deep.equal([
        `[PREFIX] has "foo" operator with invalid value [SUFFIX]. ` +
        `Value passed to "foo" operator must be "String" scalar or array.`
      ]);
  });

  it('scalarListOp returns empty list if op is a valid scalar', () => {
    const opts = { prefix: '[PREFIX]', suffix: '[SUFFIX]' };
    expect(scalarListOp(schema, 'foo', 'String', { foo: '123' }, opts))
      .to.deep.equal([ ]);
  });

  it('scalarListOp returns error if op is not a valid list', () => {
    const opts = { prefix: '[PREFIX]', suffix: '[SUFFIX]' };
    expect(scalarListOp(schema, 'foo', 'String', { foo: [ 'a', 123 ] }, opts))
      .to.deep.equal([
        `[PREFIX] has "foo" operator with invalid value [SUFFIX]. ` +
        `Value passed to "foo" operator must be "String" scalar or array.`
      ]);
  });

  it('scalarListOp returns empty list if op is a valid list', () => {
    const opts = { prefix: '[PREFIX]', suffix: '[SUFFIX]' };
    expect(scalarListOp(schema, 'foo', 'String', { foo: [ 'a', '123' ] }, opts))
      .to.deep.equal([ ]);
  });

  it('scalarOp returns empty list if exp is not object or is array', () => {
    const opts = { prefix: '[PREFIX]', suffix: '[SUFFIX]' };
    expect(scalarOp(schema, 'foo', 'String', 123, opts))
      .to.deep.equal([ ]);
    expect(scalarOp(schema, 'foo', 'String', [ 123 ], opts))
      .to.deep.equal([ ]);
  });

  it('scalarOp returns empty list if op is not in expression', () => {
    const opts = { prefix: '[PREFIX]', suffix: '[SUFFIX]' };
    expect(scalarOp(schema, 'foo', 'String', { }, opts))
      .to.deep.equal([ ]);
    expect(scalarOp(schema, 'foo', 'String', { bar: true }, opts))
      .to.deep.equal([ ]);
  });

  it('scalarOp returns error if op is not a valid scalar', () => {
    const opts = { prefix: '[PREFIX]', suffix: '[SUFFIX]' };
    expect(scalarOp(schema, 'foo', 'String', { foo: 123 }, opts))
      .to.deep.equal([
        `[PREFIX] has "foo" operator with invalid value [SUFFIX]. ` +
        `Value passed to "foo" operator must be "String" scalar.`
      ]);

    expect(scalarOp(schema, 'foo', 'String', { foo: [ 'bar' ] }, opts))
      .to.deep.equal([
        `[PREFIX] has "foo" operator with invalid value [SUFFIX]. ` +
        `Value passed to "foo" operator must be "String" scalar.`
      ]);
  });

  it('scalarOp returns empty list if op is a valid scalar', () => {
    const opts = { prefix: '[PREFIX]', suffix: '[SUFFIX]' };
    expect(scalarOp(schema, 'foo', 'String', { foo: '123' }, opts))
      .to.deep.equal([ ]);
  });

  it('scalarOpVal returns empty list if exp is not object or is array', () => {
    const vals = [ 'a', 'b', 'c' ];
    const opts = { prefix: '[PREFIX]', suffix: '[SUFFIX]' };
    expect(scalarOpVal(schema, 'foo', 'String', vals, 123, opts))
      .to.deep.equal([ ]);
    expect(scalarOpVal(schema, 'foo', 'String', vals, [ 123 ], opts))
      .to.deep.equal([ ]);
  });

  it('scalarOpVal returns empty list if op is not in expression', () => {
    const vals = [ 'a', 'b', 'c' ];
    const opts = { prefix: '[PREFIX]', suffix: '[SUFFIX]' };
    expect(scalarOpVal(schema, 'foo', 'String', vals, { }, opts))
      .to.deep.equal([ ]);
    expect(scalarOpVal(schema, 'foo', 'String', vals, { bar: true }, opts))
      .to.deep.equal([ ]);
  });

  it('scalarOpVal returns error if op is not a valid scalar', () => {
    const vals = [ 'a', 'b', 'c' ];
    const opts = { prefix: '[PREFIX]', suffix: '[SUFFIX]' };
    expect(scalarOpVal(schema, 'foo', 'String', vals, { foo: 123 }, opts))
      .to.deep.equal([
        `[PREFIX] has "foo" operator with invalid value [SUFFIX]. ` +
        `Value passed to "foo" operator must be "String" scalar with one ` +
        `of the following values: a, b, c.`
      ]);

    expect(scalarOpVal(schema, 'foo', 'String', vals, { foo: [ 'a' ] }, opts))
      .to.deep.equal([
        `[PREFIX] has "foo" operator with invalid value [SUFFIX]. ` +
        `Value passed to "foo" operator must be "String" scalar with one ` +
        `of the following values: a, b, c.`
      ]);
  });

  it('scalarOpVal returns error if op is not allowed', () => {
    const vals = [ 'a', 'b', 'c' ];
    const opts = { prefix: '[PREFIX]', suffix: '[SUFFIX]' };
    expect(scalarOpVal(schema, 'foo', 'String', vals, { foo: 'x' }, opts))
      .to.deep.equal([
        `[PREFIX] has "foo" operator with invalid value [SUFFIX]. Value ` +
        `passed to "foo" operator must be "String" scalar with one ` +
        `of the following values: a, b, c.`
      ]);
  });

  it('scalarOpVal returns empty string if op is allowed', () => {
    const vals = [ 'a', 'b', 'c' ];
    const opts = { prefix: '[PREFIX]', suffix: '[SUFFIX]' };
    expect(scalarOpVal(schema, 'foo', 'String', vals, { foo: 'a' }, opts))
      .to.deep.equal([ ]);
  });


  it('atMostOneOp returns empty list if exp is not object or is array', () => {
    const ops = [ 'a', 'b', 'c' ];
    const path = `[PATH]`;
    const opts = { prefix: '[PREFIX]', suffix: '[SUFFIX]' };
    expect(atMostOneOp(123, ops, path, opts))
      .to.deep.equal([ ]);
    expect(atMostOneOp([ 123 ], ops, path, opts))
      .to.deep.equal([ ]);
  });

  it('atMostOneOp returns empty list if exp has zero or one ops', () => {
    const ops = [ 'a', 'b', 'c' ];
    const path = `[PATH]`;
    const opts = { prefix: '[PREFIX]', suffix: '[SUFFIX]' };
    expect(atMostOneOp({ }, ops, path, opts))
      .to.deep.equal([ ]);
    expect(atMostOneOp({ a: true }, ops, path, opts))
      .to.deep.equal([ ]);
    expect(atMostOneOp({ b: true, x: true }, ops, path, opts))
      .to.deep.equal([ ]);
  });

  it('atMostOneOp returns error if exp has two or more ops', () => {
    const ops = [ 'a', 'b', 'c' ];
    const path = `[PATH]`;
    const opts = { prefix: '[PREFIX]', suffix: '[SUFFIX]' };
    expect(atMostOneOp({ a: true, b: true }, ops, path, opts))
      .to.deep.equal([
        `[PREFIX] has an invalid operator expression [SUFFIX]. ` +
        `Expected at most one of the following operators: "a", "b", "c".`
      ]);
    expect(atMostOneOp({ a: true, b: true, c: true }, ops, path, opts))
      .to.deep.equal([
        `[PREFIX] has an invalid operator expression [SUFFIX]. ` +
        `Expected at most one of the following operators: "a", "b", "c".`
      ]);
  });

  // nodeIdListOp
  it('nodeIdListOp returns empty list if exp is not object or is array', () => {
    const opts = { prefix: '[PREFIX]', suffix: '[SUFFIX]' };
    expect(nodeIdListOp(schema, 'foo', 'Foo', 123, opts))
      .to.deep.equal([ ]);
    expect(nodeIdListOp(schema, 'foo', 'Foo', [ 123 ], opts))
      .to.deep.equal([ ]);
  });

  it('nodeIdListOp returns empty list if op is not in expression', () => {
    const opts = { prefix: '[PREFIX]', suffix: '[SUFFIX]' };
    expect(nodeIdListOp(schema, 'foo', 'Foo', { }, opts))
      .to.deep.equal([ ]);
    expect(nodeIdListOp(schema, 'foo', 'Foo', { bar: true }, opts))
      .to.deep.equal([ ]);
  });

  it('nodeIdListOp returns error if op is not a valid node id', () => {
    const opts = { prefix: '[PREFIX]', suffix: '[SUFFIX]' };
    expect(nodeIdListOp(schema, 'foo', 'Foo', { foo: '123' }, opts))
      .to.deep.equal([
        `[PREFIX] has "foo" operator with invalid value [SUFFIX]. Value ` +
        `passed to "foo" operator must be "Foo" node id or array of node ids.`
      ]);
  });

  it('nodeIdListOp returns empty list if op is a valid node id', () => {
    const opts = { prefix: '[PREFIX]', suffix: '[SUFFIX]' };
    const foo = '-K9ihanBNJP9HvIYy5v7-WFF';
    expect(nodeIdListOp(schema, 'foo', 'Foo', { foo }, opts))
      .to.deep.equal([ ]);
  });

  it('nodeIdListOp returns error if op is not a valid list', () => {
    const opts = { prefix: '[PREFIX]', suffix: '[SUFFIX]' };
    const foo = '-K9ihanBNJP9HvIYy5v7-WFF';
    expect(nodeIdListOp(schema, 'foo', 'Foo', { foo: [ foo, '123' ] }, opts))
      .to.deep.equal([
        `[PREFIX] has "foo" operator with invalid value [SUFFIX]. Value ` +
        `passed to "foo" operator must be "Foo" node id or array of node ids.`
      ]);
  });

  it('nodeIdListOp returns empty list if op is a valid list', () => {
    const opts = { prefix: '[PREFIX]', suffix: '[SUFFIX]' };
    const foo = [ '-K9ihanBNJP9HvIYy5v7-WFF', '-K9ihpUnqUCkfpDt7eRI-WFF' ];
    expect(nodeIdListOp(schema, 'foo', 'Foo', { foo }, opts))
      .to.deep.equal([ ]);
  });

});
