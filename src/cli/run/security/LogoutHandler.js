import wrap from './wrap';
import { verifyAccessToken } from '../../../security/accessToken';

export const LogoutHandler = rootValue => {
  const { hooks, env: { MASTER_SECRET: secret } } = rootValue;

  return wrap(async (req, res) => {
    const accessToken = req.body.access_token;
    if (!accessToken) {
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
      const viewerId = await verifyAccessToken(accessToken, secret);
      const logoutHookResult = hooks.onLogout ?
        await hooks.onLogout({ viewerId }) :
        true;
      if (logoutHookResult !== true) {
        res.json({
          error: {
            code: 'LOGOUT_REFUSED',
            message: logoutHookResult,
          }
        });
      } else {
        res.json({ logout: true });
      }
    } catch (e) {
      res.json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Token is invalid or expired.',
        }
      });
    } finally {
      res.end();
    }
  });
};
