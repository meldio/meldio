import strip from '../../../jsutils/strip';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { parse, analyzeAST, validate } from '../../../schema';
import { newGlobalId } from '../../../jsutils/globalId';
import { validateEdgeFilter } from '../validateEdgeFilter';

const mutation = {
  name: 'test',
  clientMutationId: 'a',
  globalIds: [ ]
};

const schemaDefinition = `
  interface Named {
    name: String!
  }
  interface Countable {
    count: Int!
  }

  type ObjOne implements Named, Countable {
    name: String!
    count: Int!
  }
  type ObjTwo implements Named {
    name: String!
    cost: Float!
  }
  union UnionOne = ObjOne
  union UnionTwo = ObjOne | ObjTwo

  type EdgePropsOne {
    position: String!
    detail: ObjOne
  }

  type EdgePropsTwo {
    producedSince: Int
    detail: ObjTwo
  }

  type Widget implements Node {
    id: ID!
    assemblies: NodeConnection(Assembly, widgets, EdgePropsOne)
    producers: NodeConnection(Producer, widgets, EdgePropsTwo)
    parts: NodeConnection(Part, widgets)
  }

  type Assembly implements Node {
    id: ID!
    sku: String
    widgets: NodeConnection(Widget, assemblies, EdgePropsOne)
  }

  type Producer implements Node {
    id: ID!
    widgets: NodeConnection(Widget, producers, EdgePropsTwo)
  }

  type Part implements Node {
    id: ID!
    weight: Int
    widgets: NodeConnection(Widget, parts)
  }
`;

const ast = parse(schemaDefinition);
const schema = analyzeAST(ast);
const validationResult = validate(schema);

const mkContext = (nodeId, field) => ({
  schema,
  mutation,
  nodeId,
  field,
  function: 'filter'
});

describe('mutations / validator / validateEdgeFilter', () => {
  it('test schema is valid', () => {
    expect(validationResult).to.have.length(0);
  });

  it('throws when context is not passed', () => {
    expect(validateEdgeFilter).to.throw(Error, /must pass context/);
  });

  it('error if filter is attempted on conn without props', () => {
    const nodeId = newGlobalId('Widget');
    const field = schema.Widget.fields.find(f => f.name === 'parts');
    const context = mkContext(nodeId, field);

    const output = validateEdgeFilter(context, { foo: 'bar' });
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results).to.include(
      strip`Edge filter cannot reference edge properties because connection
         ~ defined in "parts" field does not specify edge props.`);
  });

  it('error if filter expression is nullish, scalar or array', () => {
    const nodeId = newGlobalId('Widget');
    const field = schema.Widget.fields.find(f => f.name === 'assemblies');
    const context = mkContext(nodeId, field);

    let output = validateEdgeFilter(context);
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results).to.include(
      `Edge filter must be an object expression\.`);

    output = validateEdgeFilter(context);
    expect(output.context).to.deep.equal(context, 123);
    expect(output.results).to.have.length(1);
    expect(output.results).to.include(
      `Edge filter must be an object expression\.`);

    output = validateEdgeFilter(context, [ { } ]);
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results).to.include(
      `Edge filter must be an object expression\.`);
  });

  it('validates filter expression without edge props', () => {
    const nodeId = newGlobalId('Widget');
    const field = schema.Widget.fields.find(f => f.name === 'parts');
    const context = mkContext(nodeId, field);

    const output = validateEdgeFilter(context, {
      node: {
        weight: {
          lt: 'heavy'
        }
      }
    });
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results).to.include(
      strip`Edge filter has "lt" operator with invalid value within
          ~ "node.weight" subexpression. Value passed to "lt" operator
          ~ must be "Int" scalar.`);
  });

  it('validates filter expression with edge props', () => {
    const nodeId = newGlobalId('Widget');
    const field = schema.Widget.fields.find(f => f.name === 'assemblies');
    const context = mkContext(nodeId, field);

    const output = validateEdgeFilter(context, {
      position: 123,
      node: {
        sku: {
          eq: 123
        }
      }
    });
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(2);
    expect(output.results).to.include(
      strip`Edge filter has "eq" operator with invalid value within
          ~ "node.sku" subexpression. Value passed to "eq" operator
          ~ must be "String" scalar or array.`);
    expect(output.results).to.include(
      strip`Edge filter has an invalid scalar value within "position"
          ~ subexpression. Expected "String" scalar value or array.`);
  });
});
