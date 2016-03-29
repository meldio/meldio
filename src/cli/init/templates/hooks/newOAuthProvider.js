export const newOAuthProvider =
`/* eslint no-unused-vars: 0 */

/**
 * Hook is executed when user is authenticated through OAuth 2.0 flow
 * with one of the supported OAuth providers for the first time. This is
 * an opportunity to look up if a User record exists and if not, add an
 * appropriate node. The implementation below assumes the following shape
 * of User record:
 *
 *     type User implements Node @rootViewer(field: "viewer") {
 *       id: ID!
 *       firstName: String
 *       lastName: String
 *       emails: [String]!
 *       profilePictureUrl: String
 *       # other fields...
 *    }
 *
 * @param {object} obj with provider, profile, and accessToken properties
 * @returns {string} id of the existing or newly created User node (viewerId).
 */
export async function newOAuthProvider({
  provider,     // one of 'facebook', 'google' or 'github'
  profile,      // object with profile information returned by the provider
  accessToken   // access token string returned by the provider
}) {
  const { User } = this.model;

  const emails = provider === 'github' ?
    profile.emails
      .filter(email => email.verified)
      .map(email => email.email) :
    [ profile.email ];

  const users = await User
    .filter({ emails: { some: { eq: emails } }})
    .list();

  if (!users.length) {
    const userInfo = ({
      facebook: p => ({
        firstName: p.first_name,
        lastName: p.last_name,
        emails,
        profilePictureUrl: p.picture && p.picture.data && p.picture.data.url ?
          p.picture.data.url :
          null,
      }),
      google: p => ({
        firstName: p.given_name,
        lastName: p.family_name,
        emails,
        profilePictureUrl: p.picture,
      }),
      github: p => ({
        firstName: p.name.split(' ')[0] || '',
        lastName: p.name.split(' ')[1] || '',
        emails,
        profilePictureUrl: p.avatar_url,
      }),
    }[provider])( profile );

    const user = await User.addNode(userInfo);
    return user.id;
  }

  return users[0].id;
}

`;
