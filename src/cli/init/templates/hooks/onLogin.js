
export const onLogin =
`/* eslint no-unused-vars: 0 */

/**
 * Hook is executed when a user successfully authenticates either using an OAuth
 * provider or password.  This is an opportunity to prevent a login if
 * user account is locked out or reset counter of unsuccessful login attempts.
 * @param {object} obj with viewerId, provider, providerId, profile and
 *                     accessToken properties
 * @returns {boolean | string} true if user is okay to login and string with
 *                             explanation if login should be rejected.
 */
export async function onLogin({
  viewerId,      // id of the viewer node (e.g. User node id)
  provider,      // one of 'facebook', 'google', 'github' or 'password'
  providerId,    // with OAuth: unique id assigned by the OAuth provider
                 // with password: email or phone number
  profile,       // with OAuth only: object with profile information
  accessToken,   // with OAuth only: access token string
}) {
  return true;  // ok to proceed with the login
}
`;
