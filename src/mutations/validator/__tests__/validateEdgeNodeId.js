import strip from '../../../jsutils/strip';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { parse, analyzeAST, validate } from '../../../schema';
import { newGlobalId } from '../../../jsutils/globalId';
import { validateEdgeNodeId } from '../validateEdgeNodeId';

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
  function: 'edge'
});

describe('mutations / validator / validateEdgeNodeId', () => {
  it('test schema is valid', () => {
    expect(validationResult).to.have.length(0);
  });

  it('throws when context is not passed', () => {
    expect(validateEdgeNodeId).to.throw(Error, /must pass context/);
  });

  it('returns error if id is not passed', () => {
    const nodeId = newGlobalId('Post');
    const field = schema.Post.fields.find(f => f.name === 'comments');
    const context = mkContext(nodeId, field);

    const output = validateEdgeNodeId(context);
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results).to.include(`Must pass an id to edge.`);
  });

  it('returns error if id is malformated', () => {
    const nodeId = newGlobalId('Post');
    const field = schema.Post.fields.find(f => f.name === 'comments');
    const context = mkContext(nodeId, field);

    let output = validateEdgeNodeId(context, 123);
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results)
      .to.include(`Id passed to edge is invalid.`);

    output = validateEdgeNodeId(context, 'boom!');
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results)
      .to.include(`Id passed to edge is invalid.`);

    output = validateEdgeNodeId(context, '12345678901234567890+');
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results)
      .to.include(`Id passed to edge is invalid.`);
  });

  it('returns error if id is of wrong type', () => {
    const nodeId = newGlobalId('Post');
    const field = schema.Post.fields.find(f => f.name === 'comments');
    const context = mkContext(nodeId, field);

    const output = validateEdgeNodeId(context, newGlobalId('User'));
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results)
      .to.include(`Id passed to edge must be of type "Comment".`);
  });

  it('returns empty array if id is of correct type', () => {
    const nodeId = newGlobalId('Post');
    const field = schema.Post.fields.find(f => f.name === 'comments');
    const context = mkContext(nodeId, field);

    const output = validateEdgeNodeId(context, newGlobalId('Comment'));
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(0);
  });

  it('returns error if id if for type that is not in a union', () => {
    const nodeId = newGlobalId('User');
    const field = schema.User.fields.find(f => f.name === 'actions');
    const context = mkContext(nodeId, field);

    const output = validateEdgeNodeId(context, newGlobalId('Action'));
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results)
      .to.include(`Id passed to edge must be for a member of "Action" union.`);
  });

  it('returns empty array if id if for type that is in a union', () => {
    const nodeId = newGlobalId('User');
    const field = schema.User.fields.find(f => f.name === 'actions');
    const context = mkContext(nodeId, field);

    const output = validateEdgeNodeId(context, newGlobalId('Like'));
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(0);
  });

  it('returns error if id if for type that is not interface impl', () => {
    const nodeId = newGlobalId('Like');
    const field = schema.Like.fields.find(f => f.name === 'likeOn');
    const context = mkContext(nodeId, field);

    const output = validateEdgeNodeId(context, newGlobalId('Likable'));
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results)
      .to.include(strip`Id passed to edge must be for implementation
                       ~ of "Likable" interface.`);
  });

  it('returns empty array if id if for type that is interface impl', () => {
    const nodeId = newGlobalId('Like');
    const field = schema.Like.fields.find(f => f.name === 'likeOn');
    const context = mkContext(nodeId, field);

    const output = validateEdgeNodeId(context, newGlobalId('Post'));
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(0);
  });
});
