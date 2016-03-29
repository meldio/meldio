
export const onInvalidPassword =
`/* eslint no-unused-vars: 0 */

/**
 * Hook is executed when a user attempts to login with an invalid password.
 * This is an opportunity to increment counter of unsuccessful attempts and
 * potentially lock out the account and notify the user if there has been too
 * many attempts.
 * @param {object} obj with viewerId and providerId properties
 * @returns {boolean | string} true if user should be given the standard invalid
 *                             password prompt and string if a special notice
 *                             should be returned (e.g. lockout notice)
 */
export async function onInvalidPassword({
  viewerId,     // id of the viewer node (e.g. User node id)
  providerId,   // unique login id (e.g. email or phone number)
}) {
  return true;  // standard notice is okay
}
`;
