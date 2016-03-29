import wrap from './wrap';
import { isPasswordValid, issueAccessToken } from '../../../security';

export const PasswordHandler = (rootValue, resolvers) => {
  const { db, hooks, config, env } = rootValue;
  const { getAuthProvider } = resolvers.Auth({ db, config });

  const { MASTER_SECRET: secret } = env;
  const { sessionDuration: duration, sessionDurationUnit: unit } = config;

  return wrap(async (req, res) => {
    const loginId = req.body.loginId;
    const password = req.body.password;

    if (!loginId || typeof loginId !== 'string') {
      res.json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'loginId is required and must be a string',
        }
      });
      res.end();
      return;
    }
    if (!password || typeof password !== 'string') {
      res.json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'password is required and must be a string',
        }
      });
      res.end();
      return;
    }

    try {
      const provider = 'password';
      const providerId = loginId;
      const authProvider = await getAuthProvider({ provider, providerId });
      if (!authProvider) {
        res.json({
          error: {
            code: 'INVALID_LOGINID',
            message: 'loginId provided is not found',
          }
        });
        res.end();
        return;
      }
      const viewerId = authProvider.viewerId;
      const hash = authProvider.password;
      if (!viewerId || !hash) {
        res.json({
          error: {
            code: 'INVALID_PROVIDER',
            message: 'Authentication provider for loginId is invalid.',
          }
        });
        res.end();
        return;
      }

      const isValid = await isPasswordValid(password, hash);
      if (isValid) {
        const loginHookResult = hooks.onLogin ?
          await hooks.onLogin({
            viewerId,
            provider,
            providerId
          }) :
          true;

        if (loginHookResult !== true) {
          res.json({
            error: {
              code: 'LOGIN_REFUSED',
              message: loginHookResult
            }
          });
          res.end();
          return;
        }

        const jwt = await issueAccessToken(viewerId, secret, duration, unit);
        res.json({ accessToken: jwt });
      } else {
        const invalidPasswordResult = hooks.onInvalidPassword ?
          await hooks.onInvalidPassword({ viewerId, providerId }) :
          true;

        res.json({
          error: {
            code: 'INVALID_PASSWORD',
            message: invalidPasswordResult !== true ?
              invalidPasswordResult :
              'password provided is invalid'
          }
        });
      }
    } catch (e) {
      res.json({
        error: {
          code: 'LOGIN_FAILED',
          message: 'Login failed',
        }
      });
    } finally {
      res.end();
    }
  });
};

// issueAccessToken(viewerId, secret, duration, unit)
