
export const onLogout =
`/* eslint no-unused-vars: 0 */

/**
 * Hook is executed when a user attempts to logout of the application.
 * This is an opportunity to do any required housekeeping (e.g. set last seen
 * timestamp). However, logout should seldom be rejected.
 * @param {object} obj with viewerId property
 * @returns {boolean | string} true if user is okay to logout and string with
 *                             explanation if logout should be stopped.
 */
export async function onLogout({
  viewerId,      // id of the viewer node (e.g. User node id)
}) {
  return true;  // ok to proceed with the logout
}
`;
