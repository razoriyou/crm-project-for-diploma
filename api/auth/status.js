const { getIronSession }  = require('iron-session');
const { SESSION_OPTIONS } = require('../_session');

module.exports = async function handler(req, res) {
  const session = await getIronSession(req, res, SESSION_OPTIONS);
  res.json({
    connected: !!session.googleTokens,
    user:      session.user ?? null,
  });
};
