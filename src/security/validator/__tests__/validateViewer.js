import { expect } from 'chai';
import { describe, it } from 'mocha';

import { validateViewer } from '..';

const context = {
  function: 'myFunction',
};

describe('security / validator / validateViewer', () => {
  it('throws when context is not passed', () => {
    expect(validateViewer).to.throw(Error, /must pass context/);
  });

  it('returns error if viewerType is null', () => {
    const output = validateViewer(context, null);
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results).to.include(
      `Schema must define @rootViewer for myFunction to be invoked.`);
  });

  it('returns error if viewerType is undefined', () => {
    const output = validateViewer(context, undefined);
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results).to.include(
      `Schema must define @rootViewer for myFunction to be invoked.`);
  });

  it('returns error if viewerType is empty string', () => {
    const output = validateViewer(context, '');
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(1);
    expect(output.results).to.include(
      `Schema must define @rootViewer for myFunction to be invoked.`);
  });

  it('returns empty string if viewerType is provided', () => {
    const output = validateViewer(context, 'User');
    expect(output.context).to.deep.equal(context);
    expect(output.results).to.have.length(0);
  });


});
