import { expect } from 'chai';
import { describe, it } from 'mocha';

import { validateRequired } from '..';

const context = {
  function: 'myFunction',
  parameter: 'myParameter',
};

describe('security / validator / validateRequired', () => {
  it('throws when context is not passed', () => {
    expect(validateRequired).to.throw(Error, /must pass context/);
  });

  it('returns error if value is null', () => {
    const output = validateRequired(context, null);
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results).to.include(
      `Parameter myParameter of myFunction is required.`);
  });

  it('returns error if value is undefined', () => {
    const output = validateRequired(context, undefined);
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results).to.include(
      `Parameter myParameter of myFunction is required.`);
  });

  it('returns error if value is empty string', () => {
    const output = validateRequired(context, '');
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results).to.include(
      `Parameter myParameter of myFunction is required.`);
  });

  it('returns empty array if value is false', () => {
    const output = validateRequired(context, false);
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(0);
  });

  it('returns empty array if value is 0', () => {
    const output = validateRequired(context, 0);
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(0);
  });

  it('returns empty array if value is empty object', () => {
    const output = validateRequired(context, { });
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(0);
  });

  it('returns empty array if value is a non-empty string', () => {
    const output = validateRequired(context, 'foo');
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(0);
  });

});
