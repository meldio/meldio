import { expect } from 'chai';
import { describe, it } from 'mocha';
import { hashPassword, isPasswordValid } from '../password';


describe('security / password', () => {
  it('hashPassword returns a Promise', async () => {
    const result = hashPassword('secret', 12);
    expect(result).to.be.a('promise');
  });

  it('isPasswordValid returns a Promise', async () => {
    const result = isPasswordValid('secret', 'foo');
    expect(result).to.be.a('promise');
  });

  it('hashPassword returns a string with password hash', async () => {
    const result = await hashPassword('secret', 12);
    expect(result).to.not.be.equal('secret');
    const valid = await isPasswordValid('secret', result);
    expect(valid).to.be.equal(true);
  });

  it('isPasswordValid returns false when hash is invalid', async () => {
    const valid = await isPasswordValid('secret', 'bar');
    expect(valid).to.be.equal(false);
  });
});
