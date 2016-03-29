import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { OAuth } from '../OAuth';
import qs from 'qs';

chai.use(chaiAsPromised);
chai.use(sinonChai);

const masterSecret = 'S3Ws+R0Ji6vLPrOG+LvOSU1yvzacBFdpjnc1IxG/UBk=';
const url = 'http://localhost:9000';

const google = new OAuth(
  'google',
  'goog-client-id',
  'goog-client-secret',
  [ 'goog-scope-1', 'goog-scope-2', 'goog-scope-3' ],
  masterSecret,
  url);

const facebook = new OAuth(
  'facebook',
  'fb-client-id',
  'fb-client-secret',
  [ 'fb-scope-1', 'fb-scope-2', 'fb-scope-3' ],
  masterSecret,
  url);

const github = new OAuth(
  'github',
  'gh-client-id',
  'gh-client-secret',
  [ 'gh-scope-1', 'gh-scope-2', 'gh-scope-3' ],
  masterSecret,
  url);

/* eslint no-unused-expressions:0 */
/* eslint max-len:0 */

describe('security / OAuth:', () => {
  it('Constructing OAuth with an unknow provider throws', () => {
    const makeNew = () => new OAuth(
      'foo-bar',
      'foo-client-id',
      'foo-client-secret',
      [ 'foo-scope-1', 'foo-scope-2', 'foo-scope-3' ],
      masterSecret,
      url);

    expect(makeNew).to.throw(Error,
      /OAuth constructor must be invoked with a valid provider/);
  });

  it('provider property returns expected value', () => {
    expect(facebook.provider).to.equal('facebook');
  });

  it('clientId property returns expected value', () => {
    expect(facebook.clientId).to.equal('fb-client-id');
  });

  it('clientSecret property returns expected value', () => {
    expect(facebook.clientSecret).to.equal('fb-client-secret');
  });

  it('scope property returns expected value', () => {
    expect(facebook.scope).to.equal('fb-scope-1,fb-scope-2,fb-scope-3');
    expect(google.scope).to.equal('goog-scope-1 goog-scope-2 goog-scope-3');
    expect(github.scope).to.equal('gh-scope-1,gh-scope-2,gh-scope-3');
  });

  it('masterSecretBuffer property returns expected value', () => {
    expect(facebook.masterSecretBuffer).to.be.an.instanceof(Buffer);
    expect(facebook.masterSecretBuffer.toString('base64'))
      .to.equal(masterSecret);
  });

  it('nonceAlg property returns expected value', () => {
    expect(facebook.nonceAlg).to.have.keys([ 'sign', 'verify' ]);
  });

  it('redirectUri property returns expected value', () => {
    expect(facebook.redirectUri).to.equal(`${url}/auth/facebook/callback`);
    expect(google.redirectUri).to.equal(`${url}/auth/google/callback`);
    expect(github.redirectUri).to.equal(`${url}/auth/github/callback`);
  });

  it('redirectUri property returns expected value', () => {
    expect(facebook.redirectUri).to.equal(`${url}/auth/facebook/callback`);
    expect(google.redirectUri).to.equal(`${url}/auth/google/callback`);
    expect(github.redirectUri).to.equal(`${url}/auth/github/callback`);
  });

  it(`generates and verifies state correctly`, async () => {
    for (let i = 0; i < 20; i++) {
      const state = await facebook.newState();
      expect(facebook.verifyState(state)).to.eventually.equal(true);
    }
    expect(facebook.verifyState('fooo.baaar')).to.eventually.equal(false);
    expect(facebook.verifyState('')).to.eventually.equal(false);
    expect(facebook.verifyState(null)).to.eventually.equal(false);
  });

  it(`sequentially generated states are different`, async () => {
    const states = await Promise.all(
      Array
        .apply(null, { length: 20 })
        .map( () => facebook.newState() ));

    for (let index = 0; index < states.length - 1; index++) {
      expect(states[index]).to.not.equal(states[index + 1]);
    }
  });

  it('getRedirectUrl returns correct url for each provider', async () => {
    const fb = await facebook.getRedirectUrl();
    const goog = await google.getRedirectUrl();
    const gh = await github.getRedirectUrl();

    expect(fb).to.match(/https:\/\/www\.facebook\.com\/dialog\/oauth\?client_id=fb-client-id&redirect_uri=http%3A%2F%2Flocalhost%3A9000%2Fauth%2Ffacebook%2Fcallback&state=.*&scope=fb-scope-1%2Cfb-scope-2%2Cfb-scope-3/);
    expect(goog).to.match(/https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth\?client_id=goog-client-id&redirect_uri=http%3A%2F%2Flocalhost%3A9000%2Fauth%2Fgoogle%2Fcallback&state=.*&scope=goog-scope-1%20goog-scope-2%20goog-scope-3&response_type=code/);
    expect(gh).to.match(/https:\/\/github\.com\/login\/oauth\/authorize\?client_id=gh-client-id&redirect_uri=http%3A%2F%2Flocalhost%3A9000%2Fauth%2Fgithub%2Fcallback&state=.*&scope=gh-scope-1%2Cgh-scope-2%2Cgh-scope-3/);
  });

  // fetchAccessToken(code, state)
  it('fetchAccessToken fetches facebook token', async () => {
    const state = await facebook.newState();
    const code = 'fb-code';

    const fetchStub = sinon.stub();
    const response = { async json() { } };
    const accessToken = { access_token: 'fb-access-token' }; // eslint-disable-line camelcase
    const jsonStub = sinon.stub(response, 'json');
    jsonStub.returns(Promise.resolve(accessToken));
    fetchStub.returns(Promise.resolve(response));
    facebook.injectFetchWithRetries(fetchStub);

    const result = await facebook.fetchAccessToken(code, state);
    expect(result).to.deep.equal(accessToken);

    expect(fetchStub).to.have.been.calledOnce;

    const tokenUrl = `https://graph.facebook.com/v2.5/oauth/access_token?code=fb-code&client_id=fb-client-id&client_secret=fb-client-secret&redirect_uri=http%3A%2F%2Flocalhost%3A9000%2Fauth%2Ffacebook%2Fcallback`;
    const init = {
      method: 'GET',
      fetchTimeout: 5000,
      retryDelays: [ 1000, 3000, 5000 ],
      headers: { Accept: 'application/json' }
    };
    expect(fetchStub).to.have.been.calledWith(tokenUrl, init);
  });

  it('fetchAccessToken fetches google token', async () => {
    const state = await google.newState();
    const code = 'goog-code';

    const fetchStub = sinon.stub();
    const response = { async json() { } };
    const accessToken = { access_token: 'goog-access-token' }; // eslint-disable-line camelcase
    const jsonStub = sinon.stub(response, 'json');
    jsonStub.returns(Promise.resolve(accessToken));
    fetchStub.returns(Promise.resolve(response));
    google.injectFetchWithRetries(fetchStub);

    const result = await google.fetchAccessToken(code, state);
    expect(result).to.deep.equal(accessToken);

    expect(fetchStub).to.have.been.calledOnce;

    const tokenUrl = `https://accounts.google.com/o/oauth2/token`;
    expect(fetchStub).to.have.been.calledWith(tokenUrl);
    // hard to validate form data, so skipping init part, but should
    // probably confirm some details (e.g. method, headers)
  });

  it('fetchAccessToken fetches github token', async () => {
    const state = await github.newState();
    const code = 'gh-code';

    const fetchStub = sinon.stub();
    const response = { async json() { } };
    const accessToken = { access_token: 'gh-access-token' }; // eslint-disable-line camelcase
    const jsonStub = sinon.stub(response, 'json');
    jsonStub.returns(Promise.resolve(accessToken));
    fetchStub.returns(Promise.resolve(response));
    github.injectFetchWithRetries(fetchStub);

    const result = await github.fetchAccessToken(code, state);
    expect(result).to.deep.equal(accessToken);

    expect(fetchStub).to.have.been.calledOnce;

    const tokenUrl = `https://github.com/login/oauth/access_token`;
    expect(fetchStub).to.have.been.calledWith(tokenUrl);
    // hard to validate form data, so skipping init part, but should
    // probably confirm some details (e.g. method, headers)
  });

  // fetchProfile(accessToken)
  it('fetchProfile fetches facebook profile', async () => {
    const accessToken = 'fb-access-token';

    const fetchStub = sinon.stub();
    const response = { async json() { } };
    const profile = { data: 'fb-profile-data' };
    const jsonStub = sinon.stub(response, 'json');
    jsonStub.returns(Promise.resolve(profile));
    fetchStub.returns(Promise.resolve(response));
    facebook.injectFetchWithRetries(fetchStub);

    const result = await facebook.fetchProfile(accessToken);
    expect(result).to.deep.equal({
      ...profile,
      picture: profile,
    });

    expect(fetchStub).to.have.been.calledTwice;

    const init = {
      method: 'GET',
      headers: { Accept: 'application/json' },
      fetchTimeout: 5000, /* ms */
      retryDelays: [ 1000, 3000, 5000 ], /* ms */
    };

    const firstUrl = `https://graph.facebook.com/v2.5/me?${
      qs.stringify({
        fields: 'id,email,first_name,last_name',
        'access_token': 'fb-access-token'  // eslint-disable-line quote-props
      })}`;
    const secondUrl = `https://graph.facebook.com/v2.5/me/picture?${
      qs.stringify({
        redirect: 0,
        type: 'large',
        'access_token': 'fb-access-token'  // eslint-disable-line quote-props
      })}`;
    expect(fetchStub).to.have.been.calledWith(firstUrl, init);
    expect(fetchStub).to.have.been.calledWith(secondUrl, init);
  });

  it('fetchProfile fetches google profile', async () => {
    const accessToken = 'goog-access-token';

    const fetchStub = sinon.stub();
    const response = { async json() { } };
    const profile = { data: 'goog-profile-data' };
    const jsonStub = sinon.stub(response, 'json');
    jsonStub.returns(Promise.resolve(profile));
    fetchStub.returns(Promise.resolve(response));
    google.injectFetchWithRetries(fetchStub);

    const result = await google.fetchProfile(accessToken);
    expect(result).to.deep.equal(profile);

    expect(fetchStub).to.have.been.calledOnce;

    const init = {
      method: 'GET',
      headers: { Accept: 'application/json' },
      fetchTimeout: 5000, /* ms */
      retryDelays: [ 1000, 3000, 5000 ], /* ms */
    };

    const firstUrl = `https://www.googleapis.com/oauth2/v2/userinfo?${
      qs.stringify({
        'access_token': accessToken  // eslint-disable-line quote-props
      })}`;
    expect(fetchStub).to.have.been.calledWith(firstUrl, init);
  });

  it('fetchProfile fetches github profile', async () => {
    const accessToken = 'gh-access-token';

    const fetchStub = sinon.stub();
    const response = { async json() { } };
    const profile = { data: 'gh-profile-data' };
    const jsonStub = sinon.stub(response, 'json');
    jsonStub.returns(Promise.resolve(profile));
    fetchStub.returns(Promise.resolve(response));
    github.injectFetchWithRetries(fetchStub);

    const result = await github.fetchProfile(accessToken);
    expect(result).to.deep.equal({
      ...profile,
      emails: profile,
    });

    expect(fetchStub).to.have.been.calledTwice;

    const init = {
      method: 'GET',
      headers: { Accept: 'application/json' },
      fetchTimeout: 5000, /* ms */
      retryDelays: [ 1000, 3000, 5000 ], /* ms */
    };

    const firstUrl = `https://api.github.com/user?access_token=gh-access-token`;
    const secondUrl =
      `https://api.github.com/user/emails?access_token=gh-access-token`;

    expect(fetchStub).to.have.been.calledWith(firstUrl, init);
    expect(fetchStub).to.have.been.calledWith(secondUrl, init);
  });

});
