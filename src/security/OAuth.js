import qs from 'qs';
import jwa from 'jwa';
import FormData from 'form-data';
import fetchWithRetries from 'fbjs/lib/fetchWithRetries';

import { randomBase62 } from '../jsutils/random';
import invariant from '../jsutils/invariant';

const VALID_PROVIDERS = [ 'facebook', 'google', 'github' ];
const retryInit = {
  fetchTimeout: 5000, /* ms */
  retryDelays: [ 1000, 3000, 5000 ], /* ms */
};

class OAuth {
  constructor(provider, clientId, clientSecret, scopes, masterSecret, url) {
    invariant(VALID_PROVIDERS.includes(provider),
      'OAuth constructor must be invoked with a valid provider.');

    this._fetchWithRetries = fetchWithRetries;

    Object.defineProperty(this, 'provider', ({
      get() { return provider; }
    }: any));

    Object.defineProperty(this, 'clientId', ({
      get() { return clientId; }
    }: any));

    Object.defineProperty(this, 'clientSecret', ({
      get() { return clientSecret; }
    }: any));

    Object.defineProperty(this, 'scope', ({
      get() {
        return scopes.join({
          facebook: ',',
          github: ',',
          google: ' '
        }[provider]);
      }
    }: any));

    Object.defineProperty(this, 'masterSecretBuffer', ({
      get() { return Buffer(masterSecret, 'base64'); }
    }: any));

    Object.defineProperty(this, 'nonceAlg', ({
      get() { return jwa('HS256'); }
    }: any));

    Object.defineProperty(this, 'redirectUri', ({
      get() { return `${url}/auth/${provider}/callback`; }
    }: any));
  }

  injectFetchWithRetries(fetch) {
    this._fetchWithRetries = fetch;
  }

  async newState() {
    const nonce = await randomBase62(32);
    const signature = this.nonceAlg.sign(nonce, this.masterSecretBuffer);
    return `${nonce}.${signature}`;
  }

  async verifyState(state) {
    const [ nonce, signature ] = (state || '').split('.', 2);
    return this.nonceAlg.verify(
      nonce || '',
      signature || '',
      this.masterSecretBuffer);
  }

  async getRedirectUrl() {
    const url = {
      facebook: 'https://www.facebook.com/dialog/oauth',
      github: 'https://github.com/login/oauth/authorize',
      google: 'https://accounts.google.com/o/oauth2/v2/auth',
    }[this.provider];
    const state = await this.newState();
    const queryString = qs.stringify({
      'client_id': this.clientId,       // eslint-disable-line quote-props
      'redirect_uri': this.redirectUri, // eslint-disable-line quote-props
      state,
      scope: this.scope,
      ...this.provider === 'google' ?
        { 'response_type': 'code' } :  // eslint-disable-line quote-props
        { },
    });
    return `${url}?${queryString}`;
  }

  async fetchAccessToken(code, state) {
    const url = {
      facebook: `https://graph.facebook.com/v2.5/oauth/access_token?${
        qs.stringify({
          code,
          'client_id': this.clientId,         // eslint-disable-line quote-props
          'client_secret': this.clientSecret, // eslint-disable-line quote-props
          'redirect_uri': this.redirectUri,   // eslint-disable-line quote-props
        })
      }`,
      google: `https://accounts.google.com/o/oauth2/token`,
      github: `https://github.com/login/oauth/access_token`,
    }[this.provider];

    const init = {
      method: {
        facebook: 'GET',
        google: 'POST',
        github: 'POST',
      }[this.provider],
      ...retryInit,
      headers: { Accept: 'application/json' },
    };
    if (this.provider === 'google' || this.provider === 'github') {
      const formData = new FormData();
      formData.append('code', code);
      formData.append('client_id', this.clientId);
      formData.append('client_secret', this.clientSecret);
      formData.append('redirect_uri', this.redirectUri);
      if (this.provider === 'github') {
        formData.append('state', state);
      } else if (this.provider === 'google') {
        formData.append('grant_type', 'authorization_code');
      }
      init.body = formData;
      init.headers = {
        Accept: 'application/json',
        ...formData.getHeaders(),
      };
    }
    const response = await this._fetchWithRetries(url, init);
    return response.json();
  }

  async fetchProfile(accessToken) {
    const init = {
      method: 'GET',
      headers: { Accept: 'application/json' },
      ...retryInit,
    };

    if (this.provider === 'google') {
      const url = `https://www.googleapis.com/oauth2/v2/userinfo?${
        qs.stringify({
          'access_token': accessToken  // eslint-disable-line quote-props
        })}`;
      const response = await this._fetchWithRetries(url, init);
      return response.json();
    } else if (this.provider === 'facebook') {
      // by default, facebook api returns a very small picture, so here we make
      // an explicit request for a large picture
      const urls = [
        `https://graph.facebook.com/v2.5/me?${
          qs.stringify({
            fields: 'id,email,first_name,last_name',
            'access_token': accessToken  // eslint-disable-line quote-props
          })}`,
        `https://graph.facebook.com/v2.5/me/picture?${
          qs.stringify({
            redirect: 0,
            type: 'large',
            'access_token': accessToken  // eslint-disable-line quote-props
          })}`,
      ];
      const [ profile, picture ] = await Promise.all(
        urls.map(url => this._fetchWithRetries(url, init).then(r => r.json())));

      return {
        ...profile,
        picture,
      };
    } else if (this.provider === 'github') {
      // by default, github api returns only publicly listed email, so here we
      // make an explicit request for all emails listed on the account
      const urls = [
        `https://api.github.com/user`,
        `https://api.github.com/user/emails`
      ].map(u => `${u}?${qs.stringify({
        'access_token': accessToken  // eslint-disable-line quote-props
      })}`);

      const [ profile, emails ] = await Promise.all(
        urls.map(url => this._fetchWithRetries(url, init).then(r => r.json())));

      return {
        ...profile,
        emails,
      };
    }
  }
}

export { OAuth };
