import { expect } from 'chai';
import { describe, it } from 'mocha';

import { validateViewerId } from '..';

const context = {
  function: 'myFunction',
  viewerType: 'User',
};

describe('security / validator / validateViewerId', () => {
  it('throws when context is not passed', () => {
    expect(validateViewerId).to.throw(Error, /must pass context/);
  });

  it('returns error if id is not passed', () => {
    const output = validateViewerId(context);
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results).to.include(`Must pass a viewerId to myFunction.`);
  });

  it('returns error if id is malformated', () => {
    let output = validateViewerId(context, 123);
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results)
      .to.include(`viewerId passed to myFunction is invalid.`);

    output = validateViewerId(context, 'boom!');
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results)
      .to.include(`viewerId passed to myFunction is invalid.`);

    output = validateViewerId(context, '12345678901234567890+');
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results)
      .to.include(`viewerId passed to myFunction is invalid.`);
  });

  it('returns error if viewerId is of wrong type', () => {
    const output = validateViewerId(context, '12345678901234567890-Foo');
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results)
      .to.include(`viewerId passed to myFunction must be of type "User".`);
  });

  it('returns empty array if id is valid', () => {
    const output = validateViewerId(context, '-KBpDDx9F91wtGHZvIRW-kJ5I');
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(0);
  });
});
