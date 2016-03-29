import strip from '../../../jsutils/strip';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { parse, analyzeAST, validate } from '../../../schema';
import { newGlobalId } from '../../../jsutils/globalId';
import { validateEdgeNode } from '../validateEdgeNode';
import { Model } from '../../Model';
import { NodeObject } from '../../NodeObject';

const mutation = {
  name: 'test',
  clientMutationId: 'a',
  globalIds: [ ]
};

const schemaDefinition = `
  type User implements Node {
    id: ID!
    actions: NodeConnection(Action, actionBy)
  }

  type Comment implements Node {
    id: ID!
    text: String
    timestamp: Int
    actionBy: NodeConnection(User, actions)
    commentOn: NodeConnection(Commentable, comments)
  }

  type Like implements Node {
    id: ID!
    timestamp: Int
    actionBy: NodeConnection(User, actions)
    likeOn: NodeConnection(Likable, likes)
  }

  union Action = Comment | Like

  interface Commentable {
    comments: NodeConnection(Comment, commentOn)
  }

  interface Likable {
    likes: NodeConnection(Like, likeOn)
  }

  type Post implements Node, Commentable, Likable {
    id: ID!
    # ... other stuff
    comments: NodeConnection(Comment, commentOn)
    likes: NodeConnection(Like, likeOn)
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

const model = Model({ schema, crud: { }, mutation });

describe('mutations / validator / validateEdgeNode', () => {
  it('test schema is valid', () => {
    expect(validationResult).to.have.length(0);
  });

  it('throws when context is not passed', () => {
    expect(validateEdgeNode).to.throw(Error, /must pass context/);
  });

  it('returns error if node is not passed', () => {
    const nodeId = newGlobalId('Post');
    const field = schema.Post.fields.find(f => f.name === 'comments');
    const context = mkContext(nodeId, field);

    const output = validateEdgeNode(context);
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results).to.include(`Must pass node to addEdge.`);
  });

  it('returns error if node is of incorrect type', () => {
    const nodeId = newGlobalId('Post');
    const field = schema.Post.fields.find(f => f.name === 'comments');
    const context = mkContext(nodeId, field);

    const output = validateEdgeNode(context, 123);
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results).to.include(
      `Must pass a node id or an instance of Node or NodeObject to addEdge.`);
  });

  it('returns error if node is malformated id', () => {
    const nodeId = newGlobalId('Post');
    const field = schema.Post.fields.find(f => f.name === 'comments');
    const context = mkContext(nodeId, field);

    let output = validateEdgeNode(context, 'boom!');
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results)
      .to.include(`Id passed to addEdge is invalid.`);

    output = validateEdgeNode(context, '12345678901234567890+');
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results)
      .to.include(`Id passed to addEdge is invalid.`);
  });

  it('returns error if id is of wrong type', () => {
    const nodeId = newGlobalId('Post');
    const field = schema.Post.fields.find(f => f.name === 'comments');
    const context = mkContext(nodeId, field);

    const output = validateEdgeNode(context, newGlobalId('User'));
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results)
      .to.include(`Id passed to addEdge must be of type "Comment".`);
  });

  it('returns empty array if id is of correct type', () => {
    const nodeId = newGlobalId('Post');
    const field = schema.Post.fields.find(f => f.name === 'comments');
    const context = mkContext(nodeId, field);

    const output = validateEdgeNode(context, newGlobalId('Comment'));
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(0);
  });

  it('returns error if id if for type that is not in a union', () => {
    const nodeId = newGlobalId('User');
    const field = schema.User.fields.find(f => f.name === 'actions');
    const context = mkContext(nodeId, field);

    const output = validateEdgeNode(context, newGlobalId('Action'));
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results).to.include(
      `Id passed to addEdge must be for a member of "Action" union.`);
  });

  it('returns empty array if id if for type that is in a union', () => {
    const nodeId = newGlobalId('User');
    const field = schema.User.fields.find(f => f.name === 'actions');
    const context = mkContext(nodeId, field);

    const output = validateEdgeNode(context, newGlobalId('Like'));
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(0);
  });

  it('returns error if id if for type that is not interface impl', () => {
    const nodeId = newGlobalId('Like');
    const field = schema.Like.fields.find(f => f.name === 'likeOn');
    const context = mkContext(nodeId, field);

    const output = validateEdgeNode(context, newGlobalId('Likable'));
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results)
      .to.include(strip`Id passed to addEdge must be for implementation
                       ~ of "Likable" interface.`);
  });

  it('returns empty array if id if for type that is interface impl', () => {
    const nodeId = newGlobalId('Like');
    const field = schema.Like.fields.find(f => f.name === 'likeOn');
    const context = mkContext(nodeId, field);

    const output = validateEdgeNode(context, newGlobalId('Post'));
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(0);
  });

  // Node
  it('returns error if Node is of wrong type', () => {
    const nodeId = newGlobalId('Post');
    const field = schema.Post.fields.find(f => f.name === 'comments');
    const context = mkContext(nodeId, field);

    const { User } = model;
    const node = User.node(newGlobalId('User'));

    const output = validateEdgeNode(context, node);
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results).to.include(
      `Node or NodeObject passed to addEdge must be of type "Comment".`);
  });

  it('returns empty array if Node is of correct type', () => {
    const nodeId = newGlobalId('Post');
    const field = schema.Post.fields.find(f => f.name === 'comments');
    const context = mkContext(nodeId, field);

    const { Comment } = model;
    const node = Comment.node(newGlobalId('Comment'));

    const output = validateEdgeNode(context, node);
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(0);
  });

  it('returns error if Node if for type that is not in a union', () => {
    const nodeId = newGlobalId('User');
    const field = schema.User.fields.find(f => f.name === 'actions');
    const context = mkContext(nodeId, field);

    const { Post } = model;
    const node = Post.node(newGlobalId('Post'));

    const output = validateEdgeNode(context, node);
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results).to.include(
      strip`Node or NodeObject passed to addEdge must be member of "Action"
           ~ union.`);
  });

  it('returns empty array if Node if for type that is in a union', () => {
    const nodeId = newGlobalId('User');
    const field = schema.User.fields.find(f => f.name === 'actions');
    const context = mkContext(nodeId, field);

    const { Like } = model;
    const node = Like.node(newGlobalId('Like'));

    const output = validateEdgeNode(context, node);
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(0);
  });

  it('returns error if Node is for type that is not interface impl', () => {
    const nodeId = newGlobalId('Like');
    const field = schema.Like.fields.find(f => f.name === 'likeOn');
    const context = mkContext(nodeId, field);

    const { Comment } = model;
    const node = Comment.node(newGlobalId('Comment'));

    const output = validateEdgeNode(context, node);
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results).to.include(
      strip`Node or NodeObject passed to addEdge must be implementation of
           ~ "Likable" interface.`);
  });

  it('returns empty array if Node is for type that is interface impl', () => {
    const nodeId = newGlobalId('Like');
    const field = schema.Like.fields.find(f => f.name === 'likeOn');
    const context = mkContext(nodeId, field);

    const { Post } = model;
    const node = Post.node(newGlobalId('Post'));

    const output = validateEdgeNode(context, node);
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(0);
  });

  // NodeObject
  it('returns error if NodeObject is of wrong type', () => {
    const nodeId = newGlobalId('Post');
    const field = schema.Post.fields.find(f => f.name === 'comments');
    const context = mkContext(nodeId, field);

    const node = new NodeObject({
      schema,
      crud: { },
      mutation,
      type: 'User',
      data: { id: newGlobalId('User') }
    });

    const output = validateEdgeNode(context, node);
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results).to.include(
      `Node or NodeObject passed to addEdge must be of type "Comment".`);
  });

  it('returns empty array if NodeObject is of correct type', () => {
    const nodeId = newGlobalId('Post');
    const field = schema.Post.fields.find(f => f.name === 'comments');
    const context = mkContext(nodeId, field);

    const node = new NodeObject({
      schema,
      crud: { },
      mutation,
      type: 'Comment',
      data: { id: newGlobalId('Comment') }
    });

    const output = validateEdgeNode(context, node);
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(0);
  });

  it('returns error if NodeObject if for type that is not in a union', () => {
    const nodeId = newGlobalId('User');
    const field = schema.User.fields.find(f => f.name === 'actions');
    const context = mkContext(nodeId, field);

    const node = new NodeObject({
      schema,
      crud: { },
      mutation,
      type: 'Post',
      data: { id: newGlobalId('Post') }
    });

    const output = validateEdgeNode(context, node);
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results).to.include(
      strip`Node or NodeObject passed to addEdge must be member of "Action"
           ~ union.`);
  });

  it('returns empty array if NodeObject if for type that is in a union', () => {
    const nodeId = newGlobalId('User');
    const field = schema.User.fields.find(f => f.name === 'actions');
    const context = mkContext(nodeId, field);

    const node = new NodeObject({
      schema,
      crud: { },
      mutation,
      type: 'Like',
      data: { id: newGlobalId('Like') }
    });

    const output = validateEdgeNode(context, node);
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(0);
  });

  it('returns error if NodeObject is for type that is not interface impl',
  () => {
    const nodeId = newGlobalId('Like');
    const field = schema.Like.fields.find(f => f.name === 'likeOn');
    const context = mkContext(nodeId, field);

    const node = new NodeObject({
      schema,
      crud: { },
      mutation,
      type: 'Comment',
      data: { id: newGlobalId('Comment') }
    });

    const output = validateEdgeNode(context, node);
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results).to.include(
      strip`Node or NodeObject passed to addEdge must be implementation of
           ~ "Likable" interface.`);
  });

  it('returns empty array if NodeObject is for type that is interface impl',
  () => {
    const nodeId = newGlobalId('Like');
    const field = schema.Like.fields.find(f => f.name === 'likeOn');
    const context = mkContext(nodeId, field);

    const node = new NodeObject({
      schema,
      crud: { },
      mutation,
      type: 'Post',
      data: { id: newGlobalId('Post') }
    });

    const output = validateEdgeNode(context, node);
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(0);
  });
});
