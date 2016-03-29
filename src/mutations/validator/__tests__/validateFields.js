import { expect } from 'chai';
import { describe, it } from 'mocha';
import { parse, analyzeAST, validate } from '../../../schema';
import { validateFields } from '../validateFields';

const schemaDefinition = `
  enum MyEnum { VALID_ONE VALID_TWO }

  type Obj {
    foo: Int
  }

  type BaseTestCase implements Node {
    id: ID!
    name: String!
    conn: ScalarConnection(String)
    related: NodeConnection(Related, test)
    objConn: ObjectConnection(Obj)
    count: Int
  }

  type Related implements Node {
    id: ID!
    name: String
    test: NodeConnection(BaseTestCase, related)
  }
`;

const ast = parse(schemaDefinition);
const schema = analyzeAST(ast);
const validationResult = validate(schema);

describe('mutations / validator / validateFields', () => {
  it('test schema is valid', () => {
    expect(validationResult).to.have.length(0);
  });

  it('validateFields works as expected when options are not passed', () => {
    const fields = schema['BaseTestCase'].fields;
    const path = 'root';
    const input = {
      id: '-K93iz__v1ueUkcgGB1W-S1J5j5JKT1J5',
      conn: { },
      count: 'String'
    };
    const returned = validateFields(schema, fields, input, path);
    expect(returned).to.have.length(0);
  });

  it('validateFields returns error if connection is included', () => {
    const options = { noConnections: true, prefix: '[PREFIX]' };
    const fields = schema['BaseTestCase'].fields;
    const path = 'root';
    const input = {
      id: '-K93iz__v1ueUkcgGB1W-S1J5j5JKT1J5',
      conn: { },
      related: { },
      objConn: { },
      count: 'String'
    };
    const returned = validateFields(schema, fields, input, path, options);
    expect(returned).to.have.length(3);
    expect(returned).to.deep.include(
      `[PREFIX] cannot have a connection field "root.conn".`);
    expect(returned).to.deep.include(
      `[PREFIX] cannot have a connection field "root.related".`);
    expect(returned).to.deep.include(
      `[PREFIX] cannot have a connection field "root.objConn".`);
  });

  it('validateFields returns error if required field is ommited', () => {
    const options = { enforceRequired: true, prefix: '[PREFIX]' };
    const fields = schema['BaseTestCase'].fields;
    const path = 'root';
    const input = {
      id: '-K93iz__v1ueUkcgGB1W-S1J5j5JKT1J5',
      count: 'String'
    };
    const returned = validateFields(schema, fields, input, path, options);
    expect(returned).to.have.length(1);
    expect(returned).to.deep.include(
      `[PREFIX] must have a required field "root.name".`);
  });

  it('validateFields returns error if undefined field is referenced', () => {
    const options = { noUndefinedFields: true, prefix: '[PREFIX]' };
    const fields = schema['BaseTestCase'].fields;
    const path = 'root';
    const input = {
      id: '-K93iz__v1ueUkcgGB1W-S1J5j5JKT1J5',
      boom: 'String'
    };
    const returned = validateFields(schema, fields, input, path, options);
    expect(returned).to.have.length(1);
    expect(returned).to.deep.include(
      `[PREFIX] cannot have an undefined field "root.boom".`);
  });

  it('validateFields skips undef field if in additionalAllowedFields', () => {
    const options = {
      noUndefinedFields: true,
      prefix: '[PREFIX]',
      additionalAllowedFields: [ 'boom' ]
    };
    const fields = schema['BaseTestCase'].fields;
    const path = 'root';
    const input = {
      id: '-K93iz__v1ueUkcgGB1W-S1J5j5JKT1J5',
      boom: 'String'
    };
    const returned = validateFields(schema, fields, input, path, options);
    expect(returned).to.have.length(0);
  });

  it('validateFields returns errors if they are returned by validator ', () => {
    function fieldValidator(s, f, exp, path, options) {
      return [ `${options.prefix} error with ${f.name} in ${path}` ];
    }
    const options = {
      prefix: '[PREFIX]',
      fieldValidator
    };
    const fields = schema['BaseTestCase'].fields;
    const path = 'root';
    const input = {
      id: '-K93iz__v1ueUkcgGB1W-S1J5j5JKT1J5',
      name: '[NAME]',
      conn: { },
      related: { },
      objConn: { },
      count: 212,
    };
    const returned = validateFields(schema, fields, input, path, options);
    expect(returned).to.have.length(6);
    expect(returned).to.deep.include(`[PREFIX] error with id in root`);
    expect(returned).to.deep.include(`[PREFIX] error with name in root`);
    expect(returned).to.deep.include(`[PREFIX] error with conn in root`);
    expect(returned).to.deep.include(`[PREFIX] error with related in root`);
    expect(returned).to.deep.include(`[PREFIX] error with objConn in root`);
    expect(returned).to.deep.include(`[PREFIX] error with count in root`);
  });

  it('validateFields skips fields if they are nullish', () => {
    const options = {
      prefix: '[PREFIX]',
      fieldValidator: (s, f, exp, path, opts) =>
        [ `${opts.prefix} error with ${f.name} in ${path}` ]
    };
    const fields = schema['BaseTestCase'].fields;
    const path = 'root';
    const input = {
      id: undefined,
      name: null,
      conn: null,
      related: null,
      objConn: undefined,
      count: 1,
    };
    const returned = validateFields(schema, fields, input, path, options);
    expect(returned).to.have.length(1);
    expect(returned).to.include(`[PREFIX] error with count in root`);
  });

  it('validateFields skips over connections if so specified', () => {
    function fieldValidator(s, f, exp, path, options) {
      return [ `${options.prefix} error with ${f.name} in ${path}` ];
    }
    const options = {
      prefix: '[PREFIX]',
      noConnections: true,
      fieldValidator
    };
    const fields = schema['BaseTestCase'].fields;
    const path = 'root';
    const input = {
      id: '-K93iz__v1ueUkcgGB1W-S1J5j5JKT1J5',
      name: '[NAME]',
      conn: { },
      related: { },
      objConn: { },
      count: 212,
    };
    const returned = validateFields(schema, fields, input, path, options);
    expect(returned).to.have.length(6);
    expect(returned).to.deep.include(
      `[PREFIX] cannot have a connection field "root.conn".`);
    expect(returned).to.deep.include(
      `[PREFIX] cannot have a connection field "root.related".`);
    expect(returned).to.deep.include(
      `[PREFIX] cannot have a connection field "root.objConn".`);
    expect(returned).to.deep.include(`[PREFIX] error with id in root`);
    expect(returned).to.deep.include(`[PREFIX] error with name in root`);
    expect(returned).to.deep.include(`[PREFIX] error with count in root`);
  });
});
