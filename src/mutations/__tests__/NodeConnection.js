import strip from '../../jsutils/strip';
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
import { Model } from '../Model';
import { NodeConnection } from '../NodeConnection';
import { NodeEdge } from '../NodeEdge';
import { NodeEdges } from '../NodeEdges';
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

const mkContext = (nodeId, field) => ({
  schema,
  crud: FakeCrud(),
  mutation,
  nodeId,
  field,
});

const mkModel = () => Model({
  schema,
  crud: FakeCrud(),
  mutation,
});

const commentsField = schema.Post.fields.filter(f => f.name === 'comments')[0];
const actionsField = schema.User.fields.filter(f => f.name === 'actions')[0];

describe('mutations / NodeConnection', () => {
  it('test schema is valid', () => {
    expect(validationResult).to.have.length(0);
  });

  it('could be instantiated with function call', () => {
    const id = newGlobalId('Post');
    const context = mkContext(id, commentsField);
    const comments = NodeConnection(context);
    expect(comments instanceof NodeConnection).to.equal(true);
    expect(comments.nodeId).to.equal(id);
    expect(comments.nodeField).to.equal('comments');
    expect(comments.relatedField).to.equal('commentOn');
    expect(comments.nodeType).to.equal('Comment');
    expect(comments.edgeType).to.be.null;
  });

  it('edge(id) should throw if id is invalid', () => {
    const id = newGlobalId('Post');
    const context = mkContext(id, commentsField);
    const comments = NodeConnection(context);
    expect(() => comments.edge('InvalidGlobalId'))
      .to.throw(Error, /Id passed to edge is invalid/);
  });

  it('edge(id) should return NodeEdge instance', () => {
    const id = newGlobalId('Post');
    const context = mkContext(id, commentsField);
    const comments = NodeConnection(context);
    const relatedId = newGlobalId('Comment');
    const edge = comments.edge(relatedId);
    expect(edge instanceof NodeEdge).to.equal(true);
    expect(edge.relatedId).to.equal(relatedId);
  });

  it('filter should throw if expression is invalid', () => {
    const id = newGlobalId('Post');
    const context = mkContext(id, commentsField);
    const comments = NodeConnection(context);
    expect(() => comments.filter({ foo: 'Bar' })).to.throw(Error,
      /connection defined in "comments" field does not specify edge props/);
  });

  it('filter should return NodeEdges instance with valid expression', () => {
    const id = newGlobalId('Post');
    const context = mkContext(id, commentsField);
    const comments = NodeConnection(context);
    const edges = comments.filter({ node: { text: { matches: /great/ }}});
    expect(edges instanceof NodeEdges).to.equal(true);
    expect(edges.filter).to.deep.equal({ node: { text: { matches: /great/ }}});
  });

  it('filter should throw if expression is null or undefined', () => {
    const id = newGlobalId('Post');
    const context = mkContext(id, commentsField);
    const comments = NodeConnection(context);

    expect(() => comments.filter()).to.throw(Error,
      /Edge filter must be an object expression/);

    expect(() => comments.filter(null)).to.throw(Error,
      /Edge filter must be an object expression/);

    expect(() => comments.filter(123)).to.throw(Error,
      /Edge filter must be an object expression/);

    expect(() => comments.filter([ { } ])).to.throw(Error,
      /Edge filter must be an object expression/);
  });

  it('nodeIds should invoke listRelatedNodeIds', async () => {
    const id = newGlobalId('Post');
    const context = mkContext(id, commentsField);
    const listRelatedNodeIdsStub = sinon
      .stub(context.crud.NodeConnection, 'listRelatedNodeIds');
    const data = [
      newGlobalId('Comment'),
      newGlobalId('Comment'),
      newGlobalId('Comment'),
      newGlobalId('Comment'),
    ];
    listRelatedNodeIdsStub.returns(data);
    const comments = NodeConnection(context);
    const ids = await comments.nodeIds();
    expect(ids instanceof Array).to.be.true;
    expect(ids).to.have.length(4);
    expect(ids).to.include(data[0]);
    expect(ids).to.include(data[1]);
    expect(ids).to.include(data[2]);
    expect(ids).to.include(data[3]);
    expect(listRelatedNodeIdsStub).to.have.been.calledOnce;
    expect(listRelatedNodeIdsStub).to.have.been.calledWith(id, 'comments');
  });

  it('addEdge throws if node is invalid', () => {
    const id = newGlobalId('Post');
    const context = mkContext(id, commentsField);
    const addEdgeStub = sinon.stub(context.crud.NodeConnection, 'addEdge');
    addEdgeStub.returns(true);
    const comments = NodeConnection(context);
    return Promise.all([
      expect(comments.addEdge('InvalidGlobalId')).to.eventually.be.rejectedWith(
        /Id passed to addEdge is invalid/),

      expect(comments.addEdge()).to.eventually.be.rejectedWith(
        /Must pass node to addEdge/),

      expect(comments.addEdge(null)).to.eventually.be.rejectedWith(
        /Must pass node to addEdge/),

      expect(comments.addEdge(123)).to.eventually.be.rejectedWith(
        /Must pass a node id or an instance of Node or NodeObject to addEdge/),

      expect(comments.addEdge([ { } ])).to.eventually.be.rejectedWith(
        /Must pass a node id or an instance of Node or NodeObject to addEdge/),
    ]);
  });

  it('addEdge throws if edge props are invalid', () => {
    const id = newGlobalId('Post');
    const context = mkContext(id, commentsField);
    const addEdgeStub = sinon.stub(context.crud.NodeConnection, 'addEdge');
    addEdgeStub.returns(true);
    const comments = NodeConnection(context);
    const commentId = newGlobalId('Comment');
    return expect(comments.addEdge(commentId, { foo: 123 }))
      .to.eventually.be.rejectedWith(/properties cannot be passed to addEdge/);
  });

  it('addEdge adds an edge by id without props', async () => {
    const id = newGlobalId('Post');
    const context = mkContext(id, commentsField);
    const addEdgeStub = sinon.stub(context.crud.NodeConnection, 'addEdge');
    addEdgeStub.returns(true);
    const comments = NodeConnection(context);
    const commentId = newGlobalId('Comment');
    const edge = await comments.addEdge(commentId);
    expect(edge instanceof NodeEdge).to.be.true;
    expect(edge.nodeId).to.equal(id);
    expect(edge.nodeField).to.equal('comments');
    expect(edge.relatedField).to.equal('commentOn');
    expect(edge.relatedId).to.equal(commentId);
    expect(edge.nodeType).to.equal('Comment');
    expect(edge.edgeType).to.be.null;
    expect(addEdgeStub).to.have.been.calledOnce;
    const edgeId = context.mutation.globalIds.pop();
    expect(addEdgeStub).to.have.been
      .calledWith(edgeId, id, 'comments', commentId, 'commentOn', undefined);
  });

  it('addEdge adds an edge by Node object and without props', async () => {
    const id = newGlobalId('Post');
    const context = mkContext(id, commentsField);
    const addEdgeStub = sinon.stub(context.crud.NodeConnection, 'addEdge');
    addEdgeStub.returns(true);
    const comments = NodeConnection(context);
    const commentId = newGlobalId('Comment');
    const comment = mkModel().Comment.node(commentId);
    const edge = await comments.addEdge(comment);
    expect(edge instanceof NodeEdge).to.be.true;
    expect(edge.nodeId).to.equal(id);
    expect(edge.nodeField).to.equal('comments');
    expect(edge.relatedField).to.equal('commentOn');
    expect(edge.relatedId).to.equal(commentId);
    expect(edge.nodeType).to.equal('Comment');
    expect(edge.edgeType).to.be.null;
    expect(addEdgeStub).to.have.been.calledOnce;
    const edgeId = context.mutation.globalIds.pop();
    expect(addEdgeStub).to.have.been
      .calledWith(edgeId, id, 'comments', commentId, 'commentOn', undefined);
  });

  it('addEdge adds an edge with props and returns NodeEdge', async () => {
    const id = newGlobalId('User');
    const context = mkContext(id, actionsField);
    const addEdgeStub = sinon.stub(context.crud.NodeConnection, 'addEdge');
    addEdgeStub.returns(true);
    const actions = NodeConnection(context);
    const commentId = newGlobalId('Comment');
    const comment = mkModel().Comment.node(commentId);
    const edge = await actions.addEdge(comment, { timestamp: 1454904880122 });
    expect(edge instanceof NodeEdge).to.be.true;
    expect(edge.nodeId).to.equal(id);
    expect(edge.nodeField).to.equal('actions');
    expect(edge.relatedField).to.equal('actionBy');
    expect(edge.relatedId).to.equal(commentId);
    expect(edge.nodeType).to.equal('Action');
    expect(edge.edgeType).to.equal('ActionProps');
    expect(addEdgeStub).to.have.been.calledOnce;
    const edgeId = context.mutation.globalIds.pop();
    expect(addEdgeStub).to.have.been.calledWith(
      edgeId, id, 'actions', commentId, 'actionBy', {timestamp: 1454904880122});
  });

  it('addEdge throws if add operation failed', () => {
    const id = newGlobalId('User');
    const context = mkContext(id, actionsField);
    const addEdgeStub = sinon.stub(context.crud.NodeConnection, 'addEdge');
    addEdgeStub.returns(false);
    const actions = NodeConnection(context);
    const commentId = newGlobalId('Comment');
    const comment = mkModel().Comment.node(commentId);
    return Promise.all([
      expect(actions.addEdge(comment, {timestamp: 1454904880122}))
        .to.eventually.be.rejectedWith(
          strip`Failed to add "actions" connection edge from node "${id}" to
              ~ node "${commentId}".`),
      expect(addEdgeStub).to.have.been.calledOnce,
    ]);
  });

});
