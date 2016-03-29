import chai from 'chai';
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { describe, it } from 'mocha';
import { issueAccessToken, verifyAccessToken } from '../accessToken';

chai.use(chaiAsPromised);

describe('security / accessToken', () => {
  it('issueAccessToken returns a Promise', async () => {
    const viewerId = '-KCXF0-NmK4nVoKrmhE_-kJ5I';
    const secret = 'BTw66BaSsDByM3Bt'; // base64
    const duration = 33;
    const unit = 'hours';
    const result = issueAccessToken(viewerId, secret, duration, unit);
    expect(result).to.be.a('promise');
  });

  it('verifyAccessToken returns a Promise', async () => {
    const secret = 'BTw66BaSsDByM3Bt'; // base64
    const result = verifyAccessToken('boom!', secret);
    expect(result).to.be.a('promise');
    result.catch(() => { });
  });

  it('verifyAccessToken rejects an invalid token', async () => {
    const secret = 'BTw66BaSsDByM3Bt'; // base64
    const result = verifyAccessToken('boom!', secret);
    return expect(result).to.eventually.be.rejectedWith(Error, /jwt malformed/);
  });

  it('verifyAccessToken returns viewerId when jwt is valid', async () => {
    const viewerId = '-KCXF0-NmK4nVoKrmhE_-kJ5I';
    const secret = 'BTw66BaSsDByM3Bt'; // base64
    const duration = 33;
    const unit = 'hours';
    const token = await issueAccessToken(viewerId, secret, duration, unit);
    const result = await verifyAccessToken(token, secret);
    expect(result).to.equal(viewerId);
  });

  it('verifyAccessToken rejects jwt signed with invalid key', async () => {
    const viewerId = '-KCXF0-NmK4nVoKrmhE_-kJ5I';
    const secret = 'BTw66BaSsDByM3Bt'; // base64
    const duration = 33;
    const unit = 'hours';
    const token = await issueAccessToken(viewerId, secret, duration, unit);
    const fakeSecret = 'lt5K/L3AVaomRCtw'; // base64
    const result = verifyAccessToken(token, fakeSecret);
    return expect(result)
      .to.eventually.be.rejectedWith(Error, /invalid signature/);
  });

});
