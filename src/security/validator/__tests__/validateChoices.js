import { expect } from 'chai';
import { describe, it } from 'mocha';

import { validateChoices } from '..';

const mkContext = choices => ({
  function: 'myFunction',
  parameter: 'myParameter',
  choices,
});

describe('security / validator / validateChoices', () => {
  it('throws when context is not passed', () => {
    expect(validateChoices).to.throw(Error, /must pass context/);
  });

  it('throws when choices are not passed', () => {
    expect(validateChoices.bind(null, mkContext(undefined))).to.throw(Error,
      /must pass choices to context of validateChoices/);
  });

  it('throws when choices are not array', () => {
    expect(validateChoices.bind(null, mkContext(123))).to.throw(Error,
      /choices passed to context of validateChoices must be an array/);
  });

  it('returns error if value and choices are of different type', () => {
    const context = mkContext([ 1,2,3 ]);
    const output = validateChoices(context, '1');
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results).to.include(
      `Parameter myParameter of myFunction must be one of: "1", "2", "3".`);
  });

  it('returns error if value is not among the choices', () => {
    const context = mkContext([ 1,2,3 ]);
    const output = validateChoices(context, 4);
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results).to.include(
      `Parameter myParameter of myFunction must be one of: "1", "2", "3".`);
  });

  it('returns empty array if value is among the choices', () => {
    const context = mkContext([ 'a', 'b', 'c' ]);
    const output = validateChoices(context, 'a');
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(0);
  });
});
