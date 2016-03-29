import { verifyAccessToken } from '../../../security';

export function AuthenticationHandler(secret) {
  return function (req, res, next) {
    // self-awareness
    if (req.viewerId) { return next(); }

    let accessToken;
    if (req.query.access_token) {
      accessToken = req.query.access_token;
    } else if (req.get('Authorization')) {
      const authorizationHeader = req.get('Authorization').split(' ');
      if (authorizationHeader[0] !== 'Bearer' || !authorizationHeader[1]) {
        res.json({
          errors: [ {
            code: 'INVALID_TOKEN',
            message: 'Authorization header is invalid.',
          } ]
        });
        res.end();
        return;
      }
      accessToken = authorizationHeader[1];
    } else if (req.body && req.body.access_token) {
      accessToken = req.body.access_token;
    } else {
      req.viewerId = null;
      return next();
    }

    verifyAccessToken(accessToken, secret)
      .then( viewerId => {
        req.viewerId = viewerId;
        next();
      })
      .catch( () => {
        res.json({
          errors: [ {
            code: 'INVALID_TOKEN',
            message: 'Token is invalid or expired.',
          } ]
        });
        res.end();
      } );
  };
}
