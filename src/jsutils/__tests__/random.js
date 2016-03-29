import { expect } from 'chai';
import { describe, it } from 'mocha';
import { randomBase64, randomBase62, randomBase10 } from '../random';

const lengthTests = Array.apply(null, { length: 101 }).map( (_, i) => i);

const base62Pad = ('0123456789abcdefghijklmnopqrstuvwxyz' +
                   'ABCDEFGHIJKLMNOPQRSTUVWXYZ').split('');
const base10Pad = '0123456789'.split('');


describe('Random', () => {
  lengthTests.forEach(len =>
    it('randomBase64 returns base64 string of length ' + len, async () => {
      const result = await randomBase64(len);
      const buff = new Buffer(result, 'base64');
      expect(buff.length).to.equal(len);
    }));

  lengthTests.forEach(len =>
    it('randomBase62 returns base62 string of length ' + len, async () => {
      const result = await randomBase62(len);
      const resultList = result.split('');
      expect(resultList.every(elem => base62Pad.includes(elem))).to.equal(true);
      expect(result.length).to.equal(len);
    }));

  lengthTests.forEach(len =>
    it('randomBase10 returns base10 string of length ' + len, async () => {
      const result = await randomBase10(len);
      const resultList = result.split('');
      expect(resultList.every(elem => base10Pad.includes(elem))).to.equal(true);
      expect(result.length).to.equal(len);
    }));
});
