const { getIronSession }  = require('iron-session');
const { makeOAuth2Client } = require('../_oauth');
const { SESSION_OPTIONS }  = require('../_session');

module.exports = async function handler(req, res) {
  // DELETE /api/auth/google → logout
  if (req.method === 'DELETE') {
    const session = await getIronSession(req, res, SESSION_OPTIONS);
    session.destroy();
    return res.status(200).json({ ok: true });
  }

  // GET /api/auth/google → start OAuth flow
  const url = makeOAuth2Client().generateAuthUrl({
    access_type: 'offline',
    prompt:      'consent',
    scope: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
  });
  res.redirect(url);
};
