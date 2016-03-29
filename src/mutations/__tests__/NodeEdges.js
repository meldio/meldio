import { newGlobalId } from '../../jsutils/globalId';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  parse,
  analyzeAST,
  validate
} from '../../schema';
import { FakeCrud } from './FakeCrud';
import { NodeEdges } from '../NodeEdges';
import { NodeEdgeObject } from '../NodeEdgeObject';
import { schemaDefinition } from './schemaDefinition';

chai.use(chaiAsPromised);
chai.use(sinonChai);

/* eslint no-unused-expressions:0 */

const ast = parse(schemaDefinition);
const schema = analyzeAST(ast);
const validationResult = validate(schema);
const mutation = {
  name: 'test',
  clientMutationId: 'a',
  globalIds: [ ]
};

const mkContext = (nodeId, field, filter) => ({
  schema,
  crud: FakeCrud(),
  mutation,
  nodeId,
  field,
  filter,
});

const commentsField = schema.Post.fields.filter(f => f.name === 'comments')[0];
const actionsField = schema.User.fields.filter(f => f.name === 'actions')[0];

describe('mutations / NodeEdges', () => {
  it('test schema is valid', () => {
    expect(validationResult).to.have.length(0);
  });

  it('could be instantiated with function call', () => {
    const id = newGlobalId('Post');
    const context = mkContext(id, commentsField, { text: { matches: /great/}});
    const edges = NodeEdges(context);
    expect(edges).to.be.instanceof(NodeEdges);
    expect(edges.nodeId).to.equal(id);
    expect(edges.nodeField).to.equal('comments');
    expect(edges.relatedField).to.equal('commentOn');
    expect(edges.filter).to.deep.equal({ text: { matches: /great/}});
    expect(edges.nodeType).to.equal('Comment');
    expect(edges.edgeType).to.be.null;
  });

  it('list should return array of NodeObject', async () => {
    const id = newGlobalId('Post');
    const context = mkContext(id, commentsField, { text: { matches: /great/}});
    const edges = new NodeEdges(context);
    const listEdgesStub = sinon.stub(context.crud.NodeConnection, 'listEdges');
    const timestamp = new Date().getTime();
    const data = [
      { node: { id: newGlobalId('Comment'), text: 'great post 1', timestamp }},
      { node: { id: newGlobalId('Comment'), text: 'great post 2', timestamp }},
      { node: { id: newGlobalId('Comment'), text: 'great post 3', timestamp }},
    ];
    listEdgesStub.returns(data);
    const list = await edges.list();
    expect(list).to.be.instanceof(Array);
    expect(list).to.have.length(3);
    expect(list[0]).to.be.instanceof(NodeEdgeObject);
    expect(list[0].node.id).to.equal(data[0].node.id);
    expect(list[0].node.text).to.equal(data[0].node.text);
    expect(list[0].node.timestamp).to.equal(data[0].node.timestamp);
    expect(list[1]).to.be.instanceof(NodeEdgeObject);
    expect(list[1].node.id).to.equal(data[1].node.id);
    expect(list[1].node.text).to.equal(data[1].node.text);
    expect(list[1].node.timestamp).to.equal(data[1].node.timestamp);
    expect(list[2]).to.be.instanceof(NodeEdgeObject);
    expect(list[2].node.id).to.equal(data[2].node.id);
    expect(list[2].node.text).to.equal(data[2].node.text);
    expect(list[2].node.timestamp).to.equal(data[2].node.timestamp);
    expect(listEdgesStub).to.have.been.calledOnce;
    expect(listEdgesStub).to.have.been.calledWith(
      id, 'comments', 'Comment', null, { text: { matches: /great/ } });
  });

  it('delete should return array of node ids', async () => {
    const id = newGlobalId('Post');
    const context = mkContext(id, commentsField, { text: { matches: /great/}});
    const edges = new NodeEdges(context);
    const deleteStub = sinon.stub(context.crud.NodeConnection, 'deleteEdges');
    const data = [
      newGlobalId('Comment'),
      newGlobalId('Comment'),
      newGlobalId('Comment'),
    ];
    deleteStub.returns(data);

    const deletedIds = await edges.delete();
    expect(deletedIds).to.be.instanceof(Array);
    expect(deletedIds).to.have.length(3);
    expect(deletedIds).to.include(data[0]);
    expect(deletedIds).to.include(data[1]);
    expect(deletedIds).to.include(data[2]);
    expect(deleteStub).to.have.been.calledOnce;
    expect(deleteStub).to.have.been
      .calledWith(id, 'comments', 'Comment', null, {text: {matches: /great/}});
  });

  it('update should return NodeEdges instance', async () => {
    const id = newGlobalId('User');
    const context = mkContext(id, actionsField, { text: { matches: /great/}});
    const updateStub = sinon.stub(context.crud.NodeConnection, 'updateEdges');
    const data = [
      newGlobalId('Comment'),
      newGlobalId('Comment'),
      newGlobalId('Comment'),
    ];
    updateStub.returns(data);
    const edges = new NodeEdges(context);
    const updated = await edges.update({ timestamp: 1454910460730 });
    expect(updated).to.be.an.instanceof(NodeEdges);
    expect(updated.nodeId).to.equal(id);
    expect(updated.nodeField).to.equal('actions');
    expect(updated.relatedField).to.equal('actionBy');
    expect(updated.filter).to.deep.equal(data);
    expect(updated.nodeType).to.equal('Action');
    expect(updated.edgeType).to.equal('ActionProps');

    expect(updateStub).to.have.been.calledOnce;
    expect(updateStub).to.have.been
      .calledWith(
        id, 'actions', 'Action', 'ActionProps',
        { text: { matches: /great/ } },
        { timestamp: 1454910460730 });
  });

  it('update should throw if expression is null', async () => {
    const id = newGlobalId('User');
    const context = mkContext(id, actionsField, { text: { matches: /great/}});

    return Promise.all([
      expect(NodeEdges(context).update()).to.eventually.be.rejectedWith(
        /Edge props update must be an object expression/),

      expect(NodeEdges(context).update(null)).to.eventually.be.rejectedWith(
        /Edge props update must be an object expression/),

      expect(NodeEdges(context).update(123)).to.eventually.be.rejectedWith(
        /Edge props update must be an object expression/),

      expect(NodeEdges(context).update([ { } ])).to.eventually.be.rejectedWith(
        /Edge props update must be an object expression/),
    ]);
  });

  it('update should throw if expression is invalid', () => {
    const id = newGlobalId('User');
    const context = mkContext(id, actionsField, { text: { matches: /great/}});

    return expect(NodeEdges(context).update({foo: 123}))
      .to.eventually.be.rejectedWith(
        /Edge props update cannot have an undefined field "foo"/);
  });

  it('update throws if edge has no props to update', () => {
    const id = newGlobalId('Post');
    const context = mkContext(id, commentsField, { text: { matches: /great/}});

    return expect(NodeEdges(context).update({}))
      .to.eventually.be.rejectedWith(
        /Edge properties cannot be updated/);
  });
});
