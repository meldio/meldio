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
import { NodeType } from '../NodeType';
import { Node } from '../Node';
import { Nodes } from '../Nodes';
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

const mkContext = type => ({
  schema,
  crud: FakeCrud(),
  mutation,
  type
});

describe('mutations / NodeType', () => {
  it('test schema is valid', () => {
    expect(validationResult).to.have.length(0);
  });

  it('could be instantiated with function call', () => {
    const context = mkContext('Post');
    const Post = NodeType(context);
    expect(Post instanceof NodeType).to.equal(true);
  });

  it('node(id) should throw if id is invalid', () => {
    const context = mkContext('Post');
    const Post = new NodeType(context);
    expect(() => Post.node('InvalidGlobalId'))
      .to.throw(Error, /Id passed to node is invalid/);
  });

  it('node(id) should return Node instance', () => {
    const context = mkContext('Post');
    const Post = new NodeType(context);
    const postId = newGlobalId('Post');
    const post = Post.node(postId);
    expect(post instanceof Node).to.equal(true);
    expect(post.id).to.equal(postId);
  });

  it('filter should throw if invalid expression is passed', () => {
    const context = mkContext('Post');
    const Post = new NodeType(context);
    expect(() => Post.filter({ foo: 'bar' })).to.throw(Error,
      /Filter expression cannot have an undefined field "foo"/);
  });

  it('filter should throw if expression is null or undefined', () => {
    const context = mkContext('Post');
    const Post = new NodeType(context);

    expect(() => Post.filter()).to.throw(Error,
      /Filter expression must be an object expression/);

    expect(() => Post.filter(null)).to.throw(Error,
      /Filter expression must be an object expression/);

    expect(() => Post.filter(123)).to.throw(Error,
      /Filter expression must be an object expression/);

    expect(() => Post.filter([ { } ])).to.throw(Error,
      /Filter expression must be an object expression/);
  });

  it('filter should return Nodes instance', () => {
    const context = mkContext('Post');
    const Post = new NodeType(context);
    const posts = Post.filter({ text: { matches: /GraphQL/ }});
    expect(posts instanceof Nodes).to.equal(true);
    expect(posts.filter).to.deep.equal({ text: { matches: /GraphQL/ }});
  });

  it('addNode should throw if node is null or undefined', () => {
    const context = mkContext('Post');
    const Post = new NodeType(context);

    return Promise.all([
      expect(Post.addNode()).to.eventually.be.rejectedWith(
        /Value passed to addNode must be a node object/),

      expect(Post.addNode(null)).to.eventually.be.rejectedWith(
        /Value passed to addNode must be a node object/),

      expect(Post.addNode(123)).to.eventually.be.rejectedWith(
        /Value passed to addNode must be a node object/),

      expect(Post.addNode([ { } ])).to.eventually.be.rejectedWith(
        /Value passed to addNode must be a node object/),
    ]);
  });

  it('addNode should reject if invalid node is passed', () => {
    const context = mkContext('Post');
    const Post = new NodeType(context);
    return expect(Post.addNode({ foo: 'bar' })).to.eventually.be.rejectedWith(
      /Object passed to addNode cannot have an undefined field "foo"/);
  });

  it('addNode should add a valid node if id is not provided', async () => {
    const context = mkContext('Post');
    const addNodeStub = sinon.stub(context.crud, 'addNode');
    addNodeStub.returns(true);
    const Post = new NodeType(context);
    const post = await Post.addNode({ text: 'Great picture!' });
    expect(post instanceof Node).to.equal(true);
    expect(addNodeStub).to.have.been.calledOnce;
    expect(addNodeStub).to.have.been
      .calledWith('Post', { id: post.id, text: 'Great picture!' });
  });

  it('addNode should add a valid node if id is provided', async () => {
    const context = mkContext('Post');
    const addNodeStub = sinon.stub(context.crud, 'addNode');
    addNodeStub.returns(true);
    const Post = new NodeType(context);
    const id = newGlobalId('Post');
    const post = await Post.addNode({ id, text: 'Great picture!' });
    expect(post instanceof Node).to.equal(true);
    expect(post.id).to.equal(id);
    expect(addNodeStub).to.have.been.calledOnce;
  });

  it('addNode should add a valid node if node is an empty object', async () => {
    const context = mkContext('Post');
    const addNodeStub = sinon.stub(context.crud, 'addNode');
    addNodeStub.returns(true);
    const Post = new NodeType(context);
    const post = await Post.addNode({ });
    expect(post instanceof Node).to.equal(true);
    expect(addNodeStub).to.have.been.calledOnce;
    expect(addNodeStub).to.have.been
      .calledWith('Post', { id: post.id });
  });

  it('addNode should throw error if crud operation fails', async () => {
    const context = mkContext('Post');
    const addNodeStub = sinon.stub(context.crud, 'addNode');
    addNodeStub.returns(false);
    const Post = new NodeType(context);
    return Promise.all([
      expect(Post.addNode({ text: 'fail' })).to.eventually.be.rejectedWith(
        /Failed to add node of "Post" type\./),

      expect(addNodeStub).to.have.been.calledOnce,
    ]);
  });

  it('type property should return type name', () => {
    const context = mkContext('Post');
    const Post = new NodeType(context);
    expect(Post.type).to.equal('Post');
  });
});
