import { OAuth, issueAccessToken } from '../../../security';
import { closeWith } from '../winchan';
import wrap from './wrap';

const OAuthHandlers = (rootValue, resolvers) => provider => {

  const { config, env, hooks, db } = rootValue;
  const { addAuthProvider, getAuthProvider } = resolvers.Auth({ db, config });
  const scopes = (config.scopes || { })[provider] || { };
  const baseUrl = `${config.protocol}://${config.host}:${config.port}`;
  const { sessionDuration: duration, sessionDurationUnit: unit } = config;
  const [ clientId, clientSecret ] = {
    facebook: [ env.FACEBOOK_CLIENT_ID, env.FACEBOOK_CLIENT_SECRET ],
    github: [ env.GITHUB_CLIENT_ID, env.GITHUB_CLIENT_SECRET ],
    google: [ env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET ],
  }[provider];
  const { MASTER_SECRET: secret } = env;
  const oauth = new OAuth(
    provider,
    clientId,
    clientSecret,
    scopes,
    secret,
    baseUrl);

  async function authWithAccessToken(accessToken) {
    const profile = await oauth.fetchProfile(accessToken);
    const providerId = String(profile.id);
    const authProvider = await getAuthProvider({ provider, providerId });
    let viewerId;
    if (!authProvider) {
      viewerId = await hooks.newOAuthProvider({provider, profile, accessToken});
      await addAuthProvider({
        viewerId,
        provider,
        providerId: String(providerId),
        profile,
        accessToken
      });
    } else {
      viewerId = authProvider.viewerId;
    }

    const loginHookResult = hooks.onLogin ?
      await hooks.onLogin({
        viewerId,
        provider,
        providerId,
        profile,
        accessToken
      }) :
      true;

    if (loginHookResult !== true) {
      return {
        error: {
          code: 'LOGIN_REFUSED',
          message: loginHookResult
        }
      };
    }

    const meldioJWT = await issueAccessToken(viewerId, secret, duration, unit);
    return { accessToken: meldioJWT };
  }

  const redirect = wrap(async (req, res) => {
    const url = await oauth.getRedirectUrl();
    res.redirect(url);
  });

  const codeAuth = wrap(async (req, res) => {
    const code = req.query.code;
    const state = req.query.state;
    if (req.query.error) {
      closeWith(res, {
        error: {
          code: req.query.error,
          reason: req.query.error_reason,
          message: req.query.error_description,
        }
      });
      return;
    }

    // validate state
    if (!oauth.verifyState(state)) {
      closeWith(res, {
        error: {
          code: 'INVALID_REQUEST',
          message: 'Invalid request.',
        }
      });
      return;
    }

    try {
      const token = await oauth.fetchAccessToken(code, state);
      const authResult = await authWithAccessToken(token.access_token);
      closeWith(res, authResult);
    } catch (e) {
      closeWith(res, {
        error: {
          code: 'INVALID_REQUEST',
          message: 'Authentication failed.',
        }
      });
    }
  });

  const accessTokenAuth = wrap(async (req, res) => {
    const token = req.body.access_token;
    if (!token) {
      res.json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Access token is required',
        }
      });
      res.end();
      return;
    }

    try {
      const authResult = await authWithAccessToken(token);
      res.json(authResult);
    } catch (e) {
      res.json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Access token is invalid',
        }
      });
    } finally {
      res.end();
    }
  });

  return {
    redirect,
    codeAuth,
    accessTokenAuth,
  };
};

export { OAuthHandlers };
