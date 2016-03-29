import { expect } from 'chai';
import { describe, it } from 'mocha';
import { validate } from '../validate';

describe('Schema Validation', () => {
  it('Throws when schema is not passed', () => {
    expect(validate).to.throw(Error, /must pass schema/);
  });
});
