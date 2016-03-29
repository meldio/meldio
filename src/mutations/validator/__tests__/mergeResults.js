import { expect } from 'chai';
import { describe, it } from 'mocha';
import { mergeResults } from '../mergeResults';

describe('mutations / validator / mergeResults', () => {
  it('mergeResults returns empty object if no args are passed', () => {
    expect(mergeResults()).to.deep.equal({
      context: null,
      results: [ ],
    });
  });

  it('mergeResults takes first args context', () => {
    const res1 = {
      context: { first: true },
      results: [ ],
    };
    const res2 = {
      context: { second: true },
      results: [ ],
    };
    expect(mergeResults(res1, res2)).to.deep.equal({
      context: { first: true },
      results: [ ],
    });
  });

  it('mergeResults concatinates all results in order passed', () => {
    const res1 = {
      context: { },
      results: [ 1 ],
    };
    const res2 = {
      context: { },
      results: [ 2 ],
    };
    const res3 = {
      context: { },
      results: [ 3 ],
    };
    expect(mergeResults(res1, res2, res3)).to.deep.equal({
      context: { },
      results: [ 1, 2, 3 ],
    });
  });

  it('mergeResults returns empty results array if no results are given', () => {
    const res1 = { context: { } };
    const res2 = { context: { } };
    const res3 = { context: { } };
    expect(mergeResults(res1, res2, res3)).to.deep.equal({
      context: { },
      results: [ ],
    });
  });

});
