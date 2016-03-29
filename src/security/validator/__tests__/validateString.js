import { expect } from 'chai';
import { describe, it } from 'mocha';

import { validateString } from '..';

const context = {
  function: 'myFunction',
  parameter: 'myParameter',
};

describe('security / validator / validateString', () => {
  it('throws when context is not passed', () => {
    expect(validateString).to.throw(Error, /must pass context/);
  });

  it('returns error if value is numeric', () => {
    const output = validateString(context, 1);
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results).to.include(
      `Parameter myParameter of myFunction must be a string.`);
  });

  it('returns error if value is boolean', () => {
    const output = validateString(context, true);
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results).to.include(
      `Parameter myParameter of myFunction must be a string.`);
  });

  it('returns empty array if value is a string', () => {
    const output = validateString(context, 'true');
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(0);
  });

});
