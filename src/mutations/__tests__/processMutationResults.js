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

import { processMutationResults } from '../processMutationResults';

import { Node } from '../Node';
import { NodeObject } from '../NodeObject';
import { NodeEdge } from '../NodeEdge';
import { NodeEdgeObject } from '../NodeEdgeObject';
import { Nodes } from '../Nodes';
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

const actionsField = schema.User.fields.filter(f => f.name === 'actions')[0];

describe('mutations / processMutationResults', () => {
  it('test schema is valid', () => {
    expect(validationResult).to.have.length(0);
  });

  it('gets Node, Nodes, NodeEdge and NodeEdges, leaves all else alone',
  async () => {
    const myUserId = newGlobalId('User');
    const postId = newGlobalId('Post');
    const commentId = newGlobalId('Comment');

    const crud = FakeCrud();

    const getNodeStub = sinon.stub(crud, 'getNode');
    getNodeStub.withArgs('Post', postId)
      .returns({
        id: postId,
        text: 'What a great post!',
      });

    const listNodesStub = sinon.stub(crud, 'listNodes');
    listNodesStub.withArgs('Comment', { text: { matches: /great/ }})
      .returns([
        {
          id: commentId,
          text: 'What a greatest post!',
          timestamp: 1454961961883,
        },
        {
          id: newGlobalId('Comment'),
          text: 'What a great post!',
          timestamp: 1454961961884,
        },
      ]);

    const getEdgeStub = sinon.stub(crud.NodeConnection, 'getEdge');
    getEdgeStub.withArgs(myUserId, 'actions', commentId, 'actionBy')
      .returns({
        timestamp: 1454961961882,
        node: {
          id: commentId,
          text: 'What a greatest post!',
          timestamp: 1454961961883,
        }
      });

    const listEdgesStub = sinon.stub(crud.NodeConnection, 'listEdges');
    listEdgesStub.withArgs(myUserId, 'actions', 'Action', 'ActionProps',
        { text: { matches: /greatest/ }})
      .returns([
        {
          timestamp: 1454961961885,
          node: {
            id: commentId,
            text: 'What a greatest post!',
            timestamp: 1454961961886,
          }
        }
      ]);

    const mutationResults = {
      array: [ 1, 2, 3, 4 ],
      string: 'Quick brown fox jumps over lazy dog',
      answerToTheUltimateQ: 42,
      pi: 3.14,
      post: Node({
        schema,
        crud,
        mutation,
        type: 'Post',
        id: postId,
      }),
      allGreatComments: Nodes({
        schema,
        crud,
        mutation,
        type: 'Comment',
        filter: { text: { matches: /great/ }},
      }),
      myComment: NodeEdge({
        schema,
        crud,
        mutation,
        nodeId: myUserId,
        field: actionsField,
        relatedId: commentId,
      }),
      myGreatestComments: NodeEdges({
        schema,
        crud,
        mutation,
        nodeId: myUserId,
        field: actionsField,
        filter: { text: { matches: /greatest/ }},
      }),
    };
    const results = await processMutationResults(mutationResults);
    expect(results.array).to.deep.equal([ 1, 2, 3, 4 ]);
    expect(results.string).to.equal('Quick brown fox jumps over lazy dog');
    expect(results.answerToTheUltimateQ).to.equal(42);
    expect(results.pi).to.equal(3.14);

    expect(results.post).to.be.instanceof(NodeObject);
    expect(results.post.id).to.equal(postId);
    expect(results.post.text).to.equal('What a great post!');

    expect(results.allGreatComments).to.be.instanceof(Array);
    expect(results.allGreatComments).to.have.length(2);
    expect(results.allGreatComments[0]).to.be.instanceof(NodeObject);
    expect(results.allGreatComments[0].id).to.equal(commentId);
    expect(results.allGreatComments[0].text).to.equal('What a greatest post!');
    expect(results.allGreatComments[0].timestamp).to.equal(1454961961883);
    expect(results.allGreatComments[1]).to.be.instanceof(NodeObject);
    expect(results.allGreatComments[1].text).to.equal('What a great post!');
    expect(results.allGreatComments[1].timestamp).to.equal(1454961961884);

    expect(results.myComment).to.be.instanceof(NodeEdgeObject);
    expect(results.myComment.timestamp).to.equal(1454961961882);
    expect(results.myComment.node.id).to.equal(commentId);
    expect(results.myComment.node.text).to.equal('What a greatest post!');
    expect(results.myComment.node.timestamp).to.equal(1454961961883);

    expect(results.myGreatestComments).to.be.instanceof(Array);
    expect(results.myGreatestComments).to.have.length(1);
    expect(results.myGreatestComments[0]).to.be.instanceof(NodeEdgeObject);

    expect(results.myGreatestComments[0].timestamp).to.equal(1454961961885);
    expect(results.myGreatestComments[0].node.id).to.equal(commentId);
    expect(results.myGreatestComments[0].node.text)
      .to.equal('What a greatest post!');
    expect(results.myGreatestComments[0].node.timestamp)
      .to.equal(1454961961886);
  });
});
