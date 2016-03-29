import { expect } from 'chai';
import { describe, it } from 'mocha';
import { validateId } from '../validateId';

const mutation = {
  name: 'test',
  clientMutationId: 'a',
  globalIds: [ ]
};

describe('mutations / validator / validateId', () => {
  it('throws when context is not passed', () => {
    expect(validateId).to.throw(Error, /must pass context/);
  });

  it('returns error if id is not passed', () => {
    const context = { mutation, type: 'Foo', function: 'node' };
    const output = validateId(context);
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results).to.include(`Must pass an id to node.`);
  });

  it('returns error if id is malformated', () => {
    const context = { mutation, type: 'Foo', function: 'node' };
    let output = validateId(context, 123);
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results)
      .to.include(`Id passed to node is invalid.`);

    output = validateId(context, 'boom!');
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results)
      .to.include(`Id passed to node is invalid.`);

    output = validateId(context, '12345678901234567890+');
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results)
      .to.include(`Id passed to node is invalid.`);
  });

  it('returns error if id is of wrong type', () => {
    const context = { mutation, type: 'Foo', function: 'node' };
    const output = validateId(context, '12345678901234567890-Foo');
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results)
      .to.include(`Id passed to node must be of type "Foo".`);
  });

  it('returns empty array if id is valid', () => {
    const context = { mutation, type: 'Foo', function: 'node' };
    const output = validateId(context, '-K8e2uCNwKvmakyWfyvW-WFF');
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(0);
  });
});
