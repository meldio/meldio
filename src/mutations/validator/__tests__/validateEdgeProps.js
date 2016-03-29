import strip from '../../../jsutils/strip';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { parse, analyzeAST, validate } from '../../../schema';
import { newGlobalId } from '../../../jsutils/globalId';
import { validateEdgeProps } from '../validateEdgeProps';

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
    widgets: NodeConnection(Widget, assemblies, EdgePropsOne)
  }

  type Producer implements Node {
    id: ID!
    widgets: NodeConnection(Widget, producers, EdgePropsTwo)
  }

  type Part implements Node {
    id: ID!
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
  function: 'addEdge'
});

describe('mutations / validator / validateEdgeProps', () => {
  it('test schema is valid', () => {
    expect(validationResult).to.have.length(0);
  });

  it('throws when context is not passed', () => {
    expect(validateEdgeProps).to.throw(Error, /must pass context/);
  });

  it('error if props are passed to conn without props', () => {
    const nodeId = newGlobalId('Widget');
    const field = schema.Widget.fields.find(f => f.name === 'parts');
    const context = mkContext(nodeId, field);

    const output = validateEdgeProps(context, { });
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results).to.deep.match(
      /Edge properties cannot be passed to addEdge/);
  });

  it('okay if props are not passed to conn without props', () => {
    const nodeId = newGlobalId('Widget');
    const field = schema.Widget.fields.find(f => f.name === 'parts');
    const context = mkContext(nodeId, field);

    const output = validateEdgeProps(context);
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(0);
  });

  it('error if props are not passed to conn with props that have req. fields',
  () => {
    const nodeId = newGlobalId('Widget');
    const field = schema.Widget.fields.find(f => f.name === 'assemblies');
    const context = mkContext(nodeId, field);

    const output = validateEdgeProps(context);
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results).to.deep.match(
      /must have a required field "position"\./);
  });

  it('okay if props are not passed to conn with props that have no req. fields',
  () => {
    const nodeId = newGlobalId('Widget');
    const field = schema.Widget.fields.find(f => f.name === 'producers');
    const context = mkContext(nodeId, field);

    const output = validateEdgeProps(context);
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(0);
  });

  it('validates edgeProps object', () => {
    const nodeId = newGlobalId('Widget');
    const field = schema.Widget.fields.find(f => f.name === 'assemblies');
    const context = mkContext(nodeId, field);

    const output = validateEdgeProps(context, { position: 123 });
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results).to.include(
      strip`Edge properties passed to addEdge should have "String"
           ~ value in field "position"\.`);
  });
});
