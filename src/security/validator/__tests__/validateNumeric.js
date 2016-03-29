import { expect } from 'chai';
import { describe, it } from 'mocha';

import { validateNumeric } from '..';

const context = {
  function: 'myFunction',
  parameter: 'myParameter',
};

describe('security / validator / validateNumeric', () => {
  it('throws when context is not passed', () => {
    expect(validateNumeric).to.throw(Error, /must pass context/);
  });

  it('returns error if value is boolean', () => {
    const output = validateNumeric(context, true);
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results).to.include(
      `Parameter myParameter of myFunction must be a number.`);
  });

  it('returns error if value is string', () => {
    const output = validateNumeric(context, '1');
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results).to.include(
      `Parameter myParameter of myFunction must be a number.`);
  });

  it('returns empty array if value is an integer', () => {
    const output = validateNumeric(context, 123);
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(0);
  });

  it('returns empty array if value is a float', () => {
    const output = validateNumeric(context, 123.321);
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(0);
  });

});
