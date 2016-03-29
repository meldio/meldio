import jwt from 'jsonwebtoken';
import invariant from '../jsutils/invariant';

const SIGNATURE_ALGO = 'HS512';
const UNIT_TO_SECONDS = {
  hours: 3600,
  days: 86400,
  weeks: 604800,    // 7 days
  months: 2592000,  // 30 days
};

export async function issueAccessToken(viewerId, secret, duration, unit) {
  invariant(viewerId, 'viewerId must be passed to issueAccessToken.');
  invariant(secret, 'secret must be passed to issueAccessToken.');
  invariant(UNIT_TO_SECONDS[unit], `unit must be passed to issueAccessToken.`);

  return new Promise( resolve => {
    const options = {
      algorithm: SIGNATURE_ALGO,
      expiresIn: duration * UNIT_TO_SECONDS[unit],
      subject: viewerId,
    };
    jwt.sign({ }, Buffer(secret, 'base64'), options, resolve);
  });
}

export async function verifyAccessToken(accessToken, secret) {
  return new Promise( (resolve, reject) => {
    jwt.verify(
      accessToken,
      Buffer(secret, 'base64'),
      { algorithms: [ SIGNATURE_ALGO ] },
      (error, decoded) => {
        if (error) {
          reject(error);
        } else {
          resolve(decoded.sub);
        }
      }
    );
  });
}
