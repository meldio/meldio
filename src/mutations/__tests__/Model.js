// import { newGlobalId } from '../../jsutils/globalId';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  parse,
  analyzeAST,
  validate
} from '../../schema';
import { Model } from '../Model';
import { NodeType } from '../NodeType';
import { schemaDefinition } from './schemaDefinition';

const ast = parse(schemaDefinition);
const schema = analyzeAST(ast);
const validationResult = validate(schema);
const mutation = {
  name: 'test',
  clientMutationId: 'a',
  globalIds: [ ]
};
const context = {
  schema,
  crud: { },
  mutation,
};

describe('mutations / Model', () => {
  it('test schema is valid', () => {
    expect(validationResult).to.have.length(0);
  });

  it('could be instantiated with function call', () => {
    const model = Model(context);
    expect(model instanceof Model).to.equal(true);
  });

  it('should have getter for each type that implements Node', () => {
    const model = new Model(context);
    expect(model.User instanceof NodeType).to.equal(true);
    expect(model.Comment instanceof NodeType).to.equal(true);
    expect(model.Like instanceof NodeType).to.equal(true);
    expect(model.Post instanceof NodeType).to.equal(true);
  });

  it('should not have getters for unions, interfs and non-Node types', () => {
    const model = new Model(context);
    expect(model.Action).to.be.an('undefined');
    expect(model.Commentable).to.be.an('undefined');
    expect(model.Likable).to.be.an('undefined');
    expect(model.ShouldNotBeInModel).to.be.an('undefined');
  });

});
