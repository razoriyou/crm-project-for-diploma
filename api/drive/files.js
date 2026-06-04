const { getIronSession } = require('iron-session');
const { getDriveClient } = require('../_oauth');
const { SESSION_OPTIONS } = require('../_session');

module.exports = async function handler(req, res) {
  const session = await getIronSession(req, res, SESSION_OPTIONS);
  if (!session.googleTokens) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { drive, auth } = getDriveClient(session.googleTokens);

    // Persist refreshed tokens if googleapis renewed them
    auth.on('tokens', async (tokens) => {
      session.googleTokens = { ...session.googleTokens, ...tokens };
      await session.save();
    });

    const response = await drive.files.list({
      pageSize: 100,
      fields:   'files(id,name,mimeType,modifiedTime,size,webViewLink)',
      orderBy:  'modifiedTime desc',
      q:        'trashed=false',
    });
    res.json(response.data.files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
