import { expect } from 'chai';
import { describe, it } from 'mocha';
import { base64, unbase64 } from '../base64';

const testStrings = [
  '',
  'foo',
  'quickbrownfox',
  '12345',
  // all printable ASCII chars:
  Array.apply(null, { length: 126 - 32 + 1 })
    .map((_, i) => String.fromCharCode(i + 32))
    .join('')
];

describe('base64, unbase64', () => {
  it(`basing, then unbasing returns the same string`, () => {
    testStrings.forEach(str =>
      expect(unbase64(base64(str))).to.equal(str) );
  });
});
