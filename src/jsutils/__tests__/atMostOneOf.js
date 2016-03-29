import { expect } from 'chai';
import { describe, it } from 'mocha';
import atMostOneOf from '../atMostOneOf';

const zeroTruthy = [
  [ false ],
  [ '' ],
  [ 0 ],
  [ null ],
  [ undefined ],
  [ false, '', 0, null, undefined ],
];

const oneTruthy = [
  [ true ],
  [ 'a' ],
  [ 5 ],
  [ { } ],
  [ false, true ],
  [ '', 'foo' ],
  [ 0, 1 ],
  [ null, { } ],
  [ undefined, { } ],
  [ false, '', 1, 0, null, undefined ],
];

const twoOrMoreTruthy = [
  [ true, true ],
  [ 'a', 'b' ],
  [ 5, 1 ],
  [ { }, { a: 1 } ],
  [ false, true, true ],
  [ '', 'foo', 'bar' ],
  [ 0, 1, 2 ],
  [ null, { }, { a: 1 } ],
  [ undefined, { }, { } ],
  [ true, false, '', 1, 0, null, undefined ],
  [ true, true, 'a', 1, { } ],
];

describe('atMostOneOf', () => {
  it(`Returns true if zero parameters are truthy`, () => {
    zeroTruthy.forEach(params =>
      expect(atMostOneOf(...params)).to.equal(true) );
  });

  it(`Returns true if one parameter is truthy`, () => {
    oneTruthy.forEach(params =>
      expect(atMostOneOf(...params)).to.equal(true) );
  });

  it(`Returns false if two or more parameters are truthy`, () => {
    twoOrMoreTruthy.forEach(params =>
        expect(atMostOneOf(...params)).to.equal(false) );
  });
});
