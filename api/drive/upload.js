const { getIronSession } = require('iron-session');
const { getDriveClient } = require('../_oauth');
const { SESSION_OPTIONS } = require('../_session');
const multer = require('multer');
const { Readable } = require('stream');

// Disable Vercel's built-in body parser so multer can handle multipart
module.exports.config = { api: { bodyParser: false } };

const upload = multer({ storage: multer.memoryStorage() });

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) =>
    fn(req, res, (result) => (result instanceof Error ? reject(result) : resolve(result)))
  );
}

module.exports = async function handler(req, res) {
  const session = await getIronSession(req, res, SESSION_OPTIONS);
  if (!session.googleTokens) return res.status(401).json({ error: 'Not authenticated' });

  try {
    await runMiddleware(req, res, upload.single('file'));
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const { drive, auth } = getDriveClient(session.googleTokens);

    auth.on('tokens', async (tokens) => {
      session.googleTokens = { ...session.googleTokens, ...tokens };
      await session.save();
    });

    const stream = new Readable();
    stream.push(req.file.buffer);
    stream.push(null);

    const response = await drive.files.create({
      requestBody: { name: req.file.originalname },
      media:       { mimeType: req.file.mimetype, body: stream },
      fields:      'id,name,mimeType,modifiedTime,size,webViewLink',
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
