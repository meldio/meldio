import { expect } from 'chai';
import { describe, it } from 'mocha';
import { newGlobalId, typeFromGlobalId, isGlobalId } from '../globalId';

const runNewExtractTest = type => {
  const globalId = newGlobalId(type);
  const result = typeFromGlobalId(globalId);
  return result === type;
};

const testTypes =
  [ 'Foo', 'User_', '_AReallyLongTypeName', 'Another_Type_Name', 'A', 'A1',
    'A12', 'A123', 'B',
    'AReallyLongTypeNameAReallyLongTypeNameAReallyLongTypeNameAReally' ];

describe('Global IDs', () => {
  it(`Makes a new global id and extracts types correctly`, () => {
    testTypes.forEach(type =>
        expect(runNewExtractTest(type)).to.equal(true) );
  });

  it(`Makes a new global id and confirms it is a globalId`, () => {
    testTypes.forEach(type =>
      expect(isGlobalId(newGlobalId(type))).to.equal(true) );
  });

  it(`Sequentially generated ids are monotonically increasing`, () => {
    const ids = Array
      .apply(null, { length: 1000 })
      .map( () => newGlobalId('Foo') );
    for (let index = 0; index < ids.length - 1; index++) {
      expect(ids[index] < ids[index + 1]).to.equal(true);
      expect(isGlobalId(ids[index])).to.equal(true);
    }
  });

  it(`isGlobalId recognizes ivalid globalIds`, () => {
    expect(isGlobalId()).to.equal(false);
    expect(isGlobalId(null)).to.equal(false);
    expect(isGlobalId(123)).to.equal(false);
    expect(isGlobalId('boom!')).to.equal(false);
    expect(isGlobalId('12345678901234567890+')).to.equal(false);
    expect(isGlobalId('123*5678901234567890-Foo')).to.equal(false);
  });
});
