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
import { NodeEdge } from '../NodeEdge';
import { NodeEdgeObject } from '../NodeEdgeObject';
import { NodeObject } from '../NodeObject';
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

const mkContext = (nodeId, field, relatedId) => ({
  schema,
  crud: FakeCrud(),
  mutation,
  nodeId,
  field,
  relatedId,
});

const commentsField = schema.Post.fields.filter(f => f.name === 'comments')[0];
const actionsField = schema.User.fields.filter(f => f.name === 'actions')[0];

describe('mutations / NodeEdge', () => {
  it('test schema is valid', () => {
    expect(validationResult).to.have.length(0);
  });

  it('could be instantiated with function call', () => {
    const id = newGlobalId('Post');
    const commentId = newGlobalId('Comment');
    const context = mkContext(id, commentsField, commentId);
    const edge = NodeEdge(context);
    expect(edge instanceof NodeEdge).to.equal(true);
    expect(edge.nodeId).to.equal(id);
    expect(edge.nodeField).to.equal('comments');
    expect(edge.relatedField).to.equal('commentOn');
    expect(edge.relatedId).to.equal(commentId);
    expect(edge.nodeType).to.equal('Comment');
    expect(edge.edgeType).to.be.null;
  });

  it('exists should invoke existsEdge', async () => {
    const id = newGlobalId('Post');
    const commentId = newGlobalId('Comment');
    const context = mkContext(id, commentsField, commentId);
    const existsStub = sinon.stub(context.crud.NodeConnection, 'existsEdge');
    existsStub.returns(true);
    const edge = new NodeEdge(context);
    const exists = await edge.exists();
    expect(exists).to.equal(true);
    expect(existsStub).to.have.been.calledOnce;
    expect(existsStub).to.have.been
      .calledWith(id, 'comments', commentId, 'commentOn');
  });

  it('get should return NodeEdgeObject if edge exists', async () => {
    const id = newGlobalId('Post');
    const commentId = newGlobalId('Comment');
    const context = mkContext(id, commentsField, commentId);
    const getEdgeStub = sinon.stub(context.crud.NodeConnection, 'getEdge');
    const comment = {
      id: commentId,
      text: 'Great post',
      timestamp: 1454904880122,
    };
    getEdgeStub.returns({ node: comment });
    const edge = await NodeEdge(context).get();
    expect(edge).to.be.an.instanceof(NodeEdgeObject);
    expect(edge.type.edgeType).to.be.null;
    expect(edge.type.nodeType).to.equal('Comment');
    expect(edge.type.type).to.equal('Comment');
    expect(edge.node).to.be.an.instanceof(NodeObject);
    expect(edge.node.id).to.equal(comment.id);
    expect(edge.node.text).to.equal(comment.text);
    expect(edge.node.timestamp).to.equal(comment.timestamp);
    expect(getEdgeStub).to.have.been.calledOnce;
    expect(getEdgeStub).to.have.been
      .calledWith(id, 'comments', commentId, 'commentOn');
  });

  it('get should return null if edge does not exist', async () => {
    const id = newGlobalId('Post');
    const commentId = newGlobalId('Comment');
    const context = mkContext(id, commentsField, commentId);
    const getEdgeStub = sinon.stub(context.crud.NodeConnection, 'getEdge');
    getEdgeStub.returns(null);
    const edge = await NodeEdge(context).get();
    expect(edge).to.be.null;
    expect(getEdgeStub).to.have.been.calledOnce;
    expect(getEdgeStub).to.have.been
      .calledWith(id, 'comments', commentId, 'commentOn');
  });

  it('delete should return node id if edge is deleted', async () => {
    const id = newGlobalId('Post');
    const commentId = newGlobalId('Comment');
    const context = mkContext(id, commentsField, commentId);
    const deleteStub = sinon.stub(context.crud.NodeConnection, 'deleteEdge');
    deleteStub.returns(true);
    const deletedId = await NodeEdge(context).delete();
    expect(deletedId).to.equal(commentId);
    expect(deleteStub).to.have.been.calledOnce;
    expect(deleteStub).to.have.been
      .calledWith(id, 'comments', commentId, 'commentOn');
  });

  it('delete should return null if edge is not deleted', async () => {
    const id = newGlobalId('Post');
    const commentId = newGlobalId('Comment');
    const context = mkContext(id, commentsField, commentId);
    const deleteStub = sinon.stub(context.crud.NodeConnection, 'deleteEdge');
    deleteStub.returns(false);
    const deletedId = await NodeEdge(context).delete();
    expect(deletedId).to.be.null;
    expect(deleteStub).to.have.been.calledOnce;
    expect(deleteStub).to.have.been
      .calledWith(id, 'comments', commentId, 'commentOn');
  });

  // update
  it('update should return NodeEdge instance if edge is updated', async () => {
    const id = newGlobalId('User');
    const commentId = newGlobalId('Comment');
    const context = mkContext(id, actionsField, commentId);
    const updateStub = sinon.stub(context.crud.NodeConnection, 'updateEdge');
    updateStub.returns(true);
    const edge = await NodeEdge(context).update({timestamp: 1454910460729});
    expect(edge).to.be.an.instanceof(NodeEdge);

    expect(edge.nodeId).to.equal(id);
    expect(edge.nodeField).to.equal('actions');
    expect(edge.relatedField).to.equal('actionBy');
    expect(edge.relatedId).to.equal(commentId);
    expect(edge.nodeType).to.equal('Action');
    expect(edge.edgeType).to.equal('ActionProps');

    expect(updateStub).to.have.been.calledOnce;
    expect(updateStub).to.have.been
      .calledWith(
        id, 'actions', commentId, 'actionBy', 'Action', 'ActionProps',
        { timestamp: 1454910460729 }
      );
  });

  it('update should throw if expression is null', async () => {
    const id = newGlobalId('User');
    const commentId = newGlobalId('Comment');
    const context = mkContext(id, actionsField, commentId);

    return Promise.all([
      expect(NodeEdge(context).update()).to.eventually.be.rejectedWith(
        /Edge props update must be an object expression/),

      expect(NodeEdge(context).update(null)).to.eventually.be.rejectedWith(
        /Edge props update must be an object expression/),

      expect(NodeEdge(context).update(123)).to.eventually.be.rejectedWith(
        /Edge props update must be an object expression/),

      expect(NodeEdge(context).update([ { } ])).to.eventually.be.rejectedWith(
        /Edge props update must be an object expression/),
    ]);
  });

  it('update should return null if node is not updated', async () => {
    const id = newGlobalId('User');
    const commentId = newGlobalId('Comment');
    const context = mkContext(id, actionsField, commentId);
    const updateStub = sinon.stub(context.crud.NodeConnection, 'updateEdge');
    updateStub.returns(false);
    const edge = await NodeEdge(context).update({timestamp: 1454910460729});
    expect(edge).to.be.null;
    expect(updateStub).to.have.been.calledOnce;
    expect(updateStub).to.have.been
      .calledWith(
        id, 'actions', commentId, 'actionBy', 'Action', 'ActionProps',
        { timestamp: 1454910460729 }
      );
  });

  it('update throws if edge has no props to update', () => {
    const id = newGlobalId('Post');
    const commentId = newGlobalId('Comment');
    const context = mkContext(id, commentsField, commentId);
    return expect(NodeEdge(context).update()).to.eventually.be.rejectedWith(
      /Edge properties cannot be updated/);
  });
});
