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
import { Nodes } from '../Nodes';
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

const mkContext = (type, filter) => ({
  schema,
  crud: FakeCrud(),
  mutation,
  type,
  filter,
});

describe('mutations / Nodes', () => {
  it('test schema is valid', () => {
    expect(validationResult).to.have.length(0);
  });

  it('could be instantiated with function call', () => {
    const context = mkContext('Post', { text: { matches: /great/ } });
    const posts = Nodes(context);
    expect(posts instanceof Nodes).to.equal(true);
    expect(posts.type).to.equal('Post');
    expect(posts.filter).to.deep.equal({ text: { matches: /great/ } });
  });

  it('list should return array of NodeObject', async () => {
    const context = mkContext('Post', { text: { matches: /great/ } });
    const posts = new Nodes(context);
    const listNodesStub = sinon.stub(context.crud, 'listNodes');
    const data = [
      { id: newGlobalId('Post'), text: 'great post' },
      { id: newGlobalId('Post'), text: 'great stuff' },
    ];
    listNodesStub.returns(data);
    const list = await posts.list();
    expect(list).to.have.length(2);
    expect(list[0] instanceof NodeObject).to.be.true;
    expect(list[0].id).to.equal(data[0].id);
    expect(list[1] instanceof NodeObject).to.be.true;
    expect(list[1].id).to.equal(data[1].id);
    expect(listNodesStub).to.have.been.calledOnce;
    expect(listNodesStub).to
      .have.been.calledWith('Post', { text: { matches: /great/ } });
  });

  it('delete should return list of ids', async () => {
    const context = mkContext('Post', { text: { matches: /great/ } });
    const data = [ newGlobalId('Post'), newGlobalId('Post') ];
    const deleteNodesStub = sinon.stub(context.crud, 'deleteNodes');
    deleteNodesStub.returns(data);
    const deletedIds = await Nodes(context).delete();
    expect(deletedIds).to.have.length(2);
    expect(deletedIds).to.include(data[0]);
    expect(deletedIds).to.include(data[1]);
    expect(deleteNodesStub).to.have.been.calledOnce;
    expect(deleteNodesStub).to
      .have.been.calledWith('Post', { text: { matches: /great/ } });
  });

  it('update should return Nodes instance with ids in filter', async () => {
    const context = mkContext('Post', { text: { matches: /great/ } });
    const data = [ newGlobalId('Post'), newGlobalId('Post') ];
    const updateNodesStub = sinon.stub(context.crud, 'updateNodes');
    updateNodesStub.returns(data);
    const updatedNodes = await Nodes(context).update({ text: 'good stuff' });
    expect(updatedNodes instanceof Nodes).to.be.true;
    expect(updatedNodes.filter).to.deep.equal(data);
    expect(updateNodesStub).to.have.been.calledOnce;
    expect(updateNodesStub).to.have.been.calledWith(
      'Post',
      { text: { matches: /great/ } },
      { text: 'good stuff' });
  });

  it('update should throw if expression is null or undefined', () => {
    const context = mkContext('Post', { text: { matches: /great/ } });

    return Promise.all([
      expect(Nodes(context).update()).to.eventually.be.rejectedWith(
        /Update expression must be an object expression/),

      expect(Nodes(context).update(null)).to.eventually.be.rejectedWith(
        /Update expression must be an object expression/),

      expect(Nodes(context).update(123)).to.eventually.be.rejectedWith(
        /Update expression must be an object expression/),

      expect(Nodes(context).update([ { } ])).to.eventually.be.rejectedWith(
        /Update expression must be an object expression/),
    ]);
  });
});
