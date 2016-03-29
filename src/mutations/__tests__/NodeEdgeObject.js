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
import { NodeEdgeObject } from '../NodeEdgeObject';
import { NodeEdge } from '../NodeEdge';
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

const mkContext = (nodeId, field, data) => ({
  schema,
  crud: FakeCrud(),
  mutation,
  nodeId,
  field,
  relatedId: data.node.id,
  data
});

const commentsField = schema.Post.fields.filter(f => f.name === 'comments')[0];
const actionsField = schema.User.fields.filter(f => f.name === 'actions')[0];

describe('mutations / NodeEdgeObject', () => {
  it('test schema is valid', () => {
    expect(validationResult).to.have.length(0);
  });

  it('could be instantiated with function call', () => {
    const id = newGlobalId('Post');
    const data = {
      node: {
        id: newGlobalId('Comment'),
        text: 'Great stuff!',
        timestamp: new Date().getTime(),
      }
    };
    const context = mkContext(id, commentsField, data);
    const edgeObj = NodeEdgeObject(context);
    expect(edgeObj).to.be.instanceof(NodeEdgeObject);
    expect(edgeObj.type.edgeType).to.be.null;
    expect(edgeObj.type.nodeType).to.equal('Comment');
    expect(edgeObj.type.type).to.equal('Comment');
    expect(edgeObj.node).to.be.instanceof(NodeObject);
    expect(edgeObj.node.id).to.equal(data.node.id);
    expect(edgeObj.node.text).to.equal(data.node.text);
    expect(edgeObj.node.timestamp).to.equal(data.node.timestamp);
  });

  it('delete should return relatedId if edge is deleted', async () => {
    const id = newGlobalId('Post');
    const data = {
      node: {
        id: newGlobalId('Comment'),
        text: 'Great stuff!',
        timestamp: new Date().getTime(),
      }
    };
    const context = mkContext(id, commentsField, data);
    const deleteStub = sinon.stub(context.crud.NodeConnection, 'deleteEdge');
    deleteStub.returns(true);
    const deletedId = await (new NodeEdgeObject(context)).delete();
    expect(deletedId).to.equal(data.node.id);
    expect(deleteStub).to.have.been.calledOnce;
    expect(deleteStub).to.have.been
      .calledWith(id, 'comments', data.node.id, 'commentOn');
  });

  it('delete should return null if edge is not deleted', async () => {
    const id = newGlobalId('Post');
    const data = {
      node: {
        id: newGlobalId('Comment'),
        text: 'Great stuff!',
        timestamp: new Date().getTime(),
      }
    };
    const context = mkContext(id, commentsField, data);
    const deleteStub = sinon.stub(context.crud.NodeConnection, 'deleteEdge');
    deleteStub.returns(false);
    const deletedId = await NodeEdgeObject(context).delete();
    expect(deletedId).to.be.null;
    expect(deleteStub).to.have.been.calledOnce;
    expect(deleteStub).to.have.been
      .calledWith(id, 'comments', data.node.id, 'commentOn');
  });

  it('update should return NodeEdge instance if edge is updated', async () => {
    const id = newGlobalId('User');
    const data = {
      timestamp: 1454960045306,
      node: {
        id: newGlobalId('Comment'),
        text: 'Great stuff!',
        timestamp: new Date().getTime(),
      }
    };
    const context = mkContext(id, actionsField, data);
    const updateStub = sinon.stub(context.crud.NodeConnection, 'updateEdge');
    updateStub.returns(true);
    const edge = await NodeEdgeObject(context)
      .update({ timestamp: 1454960055867 });
    expect(edge).to.be.an.instanceof(NodeEdge);

    expect(edge.nodeId).to.equal(id);
    expect(edge.nodeField).to.equal('actions');
    expect(edge.relatedField).to.equal('actionBy');
    expect(edge.relatedId).to.equal(data.node.id);
    expect(edge.nodeType).to.equal('Action');
    expect(edge.edgeType).to.equal('ActionProps');

    expect(updateStub).to.have.been.calledOnce;
    expect(updateStub).to.have.been
      .calledWith(
        id, 'actions', data.node.id, 'actionBy', 'Action', 'ActionProps',
        { timestamp: 1454960055867 }
      );
  });

  it('update should throw if expression is null', async () => {
    const id = newGlobalId('User');
    const data = {
      timestamp: 1454960045306,
      node: {
        id: newGlobalId('Comment'),
        text: 'Great stuff!',
        timestamp: new Date().getTime(),
      }
    };
    const context = mkContext(id, actionsField, data);

    expect(NodeEdgeObject(context).update()).to.eventually.be.rejectedWith(
      /Edge props update must be an object expression/);

    expect(NodeEdgeObject(context).update(null)).to.eventually.be.rejectedWith(
      /Edge props update must be an object expression/);

    expect(NodeEdgeObject(context).update(123)).to.eventually.be.rejectedWith(
      /Edge props update must be an object expression/);

    expect(NodeEdgeObject(context).update([ { } ]))
      .to.eventually.be.rejectedWith(
        /Edge props update must be an object expression/);
  });

  it('update should return null if node is not updated', async () => {
    const id = newGlobalId('User');
    const data = {
      timestamp: 1454960045306,
      node: {
        id: newGlobalId('Comment'),
        text: 'Great stuff!',
        timestamp: new Date().getTime(),
      }
    };
    const context = mkContext(id, actionsField, data);
    const updateStub = sinon.stub(context.crud.NodeConnection, 'updateEdge');
    updateStub.returns(false);
    const edge = await NodeEdgeObject(context)
      .update({ timestamp: 1454960055867 });
    expect(edge).to.be.null;
    expect(updateStub).to.have.been.calledOnce;
    expect(updateStub).to.have.been
      .calledWith(
        id, 'actions', data.node.id, 'actionBy', 'Action', 'ActionProps',
        { timestamp: 1454960055867 }
      );
  });

  it('update throws if edge has no props to update', () => {
    const id = newGlobalId('Post');
    const data = {
      node: {
        id: newGlobalId('Comment'),
        text: 'Great stuff!',
        timestamp: new Date().getTime(),
      }
    };
    const context = mkContext(id, commentsField, data);
    expect(NodeEdge(context).update()).to.eventually.be.rejectedWith(
      /Edge properties cannot be updated/);
  });

  it('should be able to access edge and node properties', async () => {
    const id = newGlobalId('User');
    const data = {
      timestamp: 1454960045306,
      node: {
        id: newGlobalId('Comment'),
        text: 'Great stuff!',
        timestamp: new Date().getTime(),
      }
    };
    const context = mkContext(id, actionsField, data);
    const edgeObj = NodeEdgeObject(context);
    expect(edgeObj.timestamp).to.equal(1454960045306);
    expect(edgeObj.node.id).to.equal(data.node.id);
    expect(edgeObj.node.text).to.equal('Great stuff!');
    expect(edgeObj.node.timestamp).to.equal(data.node.timestamp);
  });

  it('edge props should default to null if value does not exist', async () => {
    const id = newGlobalId('User');
    const data = {
      node: {
        id: newGlobalId('Comment'),
        text: 'Great stuff!',
        timestamp: new Date().getTime(),
      }
    };
    const context = mkContext(id, actionsField, data);
    const edgeObj = NodeEdgeObject(context);
    expect(edgeObj.timestamp).to.be.null;
  });
});
