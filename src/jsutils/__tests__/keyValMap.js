import { expect } from 'chai';
import { describe, it } from 'mocha';
import keyValMap from '../keyValMap';

describe('keyValMap', () => {
  it('returns empty object when array is empty', () => {
    const result = keyValMap([ ], e => e.name, e => e.value );
    expect(result).to.deep.equal({ });
  });
  it('returns map from an array', () => {
    const testCase = [
      { name: 'john', value: 1 },
      { name: 'smith', value: 2 },
      { name: 'foo', value: 3 },
      { name: 'bar', value: 4 },
    ];
    const result = keyValMap(testCase, e => e.name, e => e.value );
    expect(result).to.deep.equal({
      john: 1,
      smith: 2,
      foo: 3,
      bar: 4,
    });
  });
});
