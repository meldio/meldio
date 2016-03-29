import { expect } from 'chai';
import { describe, it } from 'mocha';

import { validateBoolean } from '..';

const context = {
  function: 'myFunction',
  parameter: 'myParameter',
};

describe('security / validator / validateBoolean', () => {
  it('throws when context is not passed', () => {
    expect(validateBoolean).to.throw(Error, /must pass context/);
  });

  it('returns error if value is numeric', () => {
    const output = validateBoolean(context, 1);
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results).to.include(
      `Parameter myParameter of myFunction must be a boolean.`);
  });

  it('returns error if value is string', () => {
    const output = validateBoolean(context, '1');
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results).to.include(
      `Parameter myParameter of myFunction must be a boolean.`);
  });

  it('returns empty array if value is true', () => {
    const output = validateBoolean(context, true);
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(0);
  });

  it('returns empty array if value is false', () => {
    const output = validateBoolean(context, false);
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(0);
  });

});
