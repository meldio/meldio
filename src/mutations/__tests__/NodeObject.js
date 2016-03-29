import { newGlobalId, typeFromGlobalId } from '../../jsutils/globalId';
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
import { Node } from '../Node';
import { NodeObject } from '../NodeObject';
import { NodeConnection } from '../NodeConnection';
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

const mkContext = data => ({
  schema,
  crud: FakeCrud(),
  mutation,
  type: typeFromGlobalId(data.id),
  data,
});

describe('mutations / NodeObject', () => {
  it('test schema is valid', () => {
    expect(validationResult).to.have.length(0);
  });

  it('could be instantiated with function call', () => {
    const data = {
      id: newGlobalId('Post'),
      text: 'Great stuff!'
    };
    const context = mkContext(data);
    const post = NodeObject(context);
    expect(post instanceof NodeObject).to.equal(true);
    expect(post.type).to.equal('Post');
    expect(post.id).to.equal(data.id);
    expect(post.text).to.equal(data.text);
  });

  it('delete should return id if node is deleted', async () => {
    const data = {
      id: newGlobalId('Post'),
      text: 'Great stuff!'
    };
    const context = mkContext(data);
    const deleteNodeStub = sinon.stub(context.crud, 'deleteNode');
    deleteNodeStub.returns(true);
    const deletedId = await (new NodeObject(context)).delete();
    expect(deletedId).to.equal(data.id);
    expect(deleteNodeStub).to.have.been.calledOnce;
    expect(deleteNodeStub).to.have.been.calledWith('Post', data.id);
  });

  it('delete should return null if node is not deleted', async () => {
    const data = {
      id: newGlobalId('Post'),
      text: 'Great stuff!'
    };
    const context = mkContext(data);
    const deleteNodeStub = sinon.stub(context.crud, 'deleteNode');
    deleteNodeStub.returns(false);
    const deletedId = await NodeObject(context).delete();
    expect(deletedId).to.be.null;
    expect(deleteNodeStub).to.have.been.calledOnce;
    expect(deleteNodeStub).to.have.been.calledWith('Post', data.id);
  });

  // update
  it('update should return Node instance if node is updated', async () => {
    const data = {
      id: newGlobalId('Post'),
      text: 'Great stuff!'
    };
    const context = mkContext(data);
    const updateNodeStub = sinon.stub(context.crud, 'updateNode');
    updateNodeStub.returns(true);
    const updated = await NodeObject(context).update({text: 'Looks great'});
    expect(updated instanceof Node).to.equal(true);
    expect(updated.id).to.equal(data.id);
    expect(updateNodeStub).to.have.been.calledOnce;
    expect(updateNodeStub).to.have.been
      .calledWith('Post', data.id, {text: 'Looks great'});
  });

  it('update should return null if node is not updated', async () => {
    const data = {
      id: newGlobalId('Post'),
      text: 'Great stuff!'
    };
    const context = mkContext(data);
    const updateNodeStub = sinon.stub(context.crud, 'updateNode');
    updateNodeStub.returns(false);
    const updated = await NodeObject(context).update({text: 'Looks great'});
    expect(updated).to.be.null;
    expect(updateNodeStub).to.have.been.calledOnce;
    expect(updateNodeStub).to.have.been
      .calledWith('Post', data.id, {text: 'Looks great'});
  });

  it('update should throw if expression is null or undefined', () => {
    const data = {
      id: newGlobalId('Post'),
      text: 'Great stuff!'
    };
    const context = mkContext(data);

    return Promise.all([
      expect(NodeObject(context).update()).to.eventually.be.rejectedWith(
        /Update expression must be an object expression/),

      expect(NodeObject(context).update(null)).to.eventually.be.rejectedWith(
        /Update expression must be an object expression/),

      expect(NodeObject(context).update(123)).to.eventually.be.rejectedWith(
        /Update expression must be an object expression/),

      expect(NodeObject(context).update([ { } ])).to.eventually.be.rejectedWith(
        /Update expression must be an object expression/),
    ]);
  });

  it('node conn getters should return NodeConnection instances', async () => {
    const data = {
      id: newGlobalId('Post'),
      text: 'Great stuff!'
    };
    const context = mkContext(data);
    const post = new NodeObject(context);

    expect(post.comments instanceof NodeConnection).to.be.true;
    expect(post.comments.nodeId).to.equal(data.id);
    expect(post.comments.nodeField).to.equal('comments');
    expect(post.comments.relatedField).to.equal('commentOn');
    expect(post.comments.nodeType).to.equal('Comment');
    expect(post.comments.edgeType).to.be.null;
    expect(post.likes instanceof NodeConnection).to.be.true;
    expect(post.likes.nodeId).to.equal(data.id);
    expect(post.likes.nodeField).to.equal('likes');
    expect(post.likes.relatedField).to.equal('likeOn');
    expect(post.likes.nodeType).to.equal('Like');
    expect(post.likes.edgeType).to.be.null;
  });

  it('returns null for fields that do not have value', async () => {
    const data = {
      id: newGlobalId('Post'),
    };
    const context = mkContext(data);
    const post = new NodeObject(context);

    expect(post.text).to.be.null;
  });
});
