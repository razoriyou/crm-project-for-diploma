const { getIronSession }           = require('iron-session');
const { makeOAuth2Client }          = require('../_oauth');
const { SESSION_OPTIONS }           = require('../_session');
const { google }                    = require('googleapis');

module.exports = async function handler(req, res) {
  try {
    const auth = makeOAuth2Client();
    const { tokens } = await auth.getToken(req.query.code);
    auth.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth });
    const { data } = await oauth2.userinfo.get();

    const session = await getIronSession(req, res, SESSION_OPTIONS);
    session.googleTokens = tokens;
    session.user = {
      name:    data.name,
      email:   data.email,
      picture: data.picture,
    };
    await session.save();

    res.redirect('/?auth=success');
  } catch {
    res.redirect('/?auth=error');
  }
};
