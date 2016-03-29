import { expect } from 'chai';
import { describe, it } from 'mocha';
import invariant from '../invariant';

describe('Invariant', () => {
  it('Throws when false is passed to invatiant', () => {
    const result = invariant.bind(null, false, 'Throws some text');
    expect(result).to.throw(Error, /Throws some text/);
  });

  it('Doesn\'t throw when true is passed to invatiant', () => {
    const result = invariant.bind(null, true, 'Throws some text');
    expect(result).to.not.throw(Error);
  });
});
