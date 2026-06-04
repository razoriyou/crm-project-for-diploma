require('dotenv').config();
const express        = require('express');
const serverless     = require('serverless-http');
const multer         = require('multer');
const { google }     = require('googleapis');
const { Readable }   = require('stream');
const { getIronSession } = require('iron-session');

const app    = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());

const SESSION_OPTIONS = {
  cookieName: 'crm_gdrive',
  password:   process.env.SESSION_SECRET,
  cookieOptions: {
    secure:   process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 7,
  },
};

function makeOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
}

function getDriveClient(tokens) {
  const auth = makeOAuth2Client();
  auth.setCredentials(tokens);
  return { drive: google.drive({ version: 'v3', auth }), auth };
}

// ── Auth ──────────────────────────────────────────────────────────────────────

app.get('/api/auth/google', (_req, res) => {
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
});

app.delete('/api/auth/google', async (req, res) => {
  const session = await getIronSession(req, res, SESSION_OPTIONS);
  session.destroy();
  res.json({ ok: true });
});

app.get('/api/auth/callback', async (req, res) => {
  try {
    const auth = makeOAuth2Client();
    const { tokens } = await auth.getToken(req.query.code);
    auth.setCredentials(tokens);

    const oauth2    = google.oauth2({ version: 'v2', auth });
    const { data }  = await oauth2.userinfo.get();

    const session   = await getIronSession(req, res, SESSION_OPTIONS);
    session.googleTokens = tokens;
    session.user = { name: data.name, email: data.email, picture: data.picture };
    await session.save();

    res.redirect('/?auth=success');
  } catch {
    res.redirect('/?auth=error');
  }
});

app.get('/api/auth/status', async (req, res) => {
  const session = await getIronSession(req, res, SESSION_OPTIONS);
  res.json({ connected: !!session.googleTokens, user: session.user ?? null });
});

// ── Drive ─────────────────────────────────────────────────────────────────────

app.get('/api/drive/files', async (req, res) => {
  const session = await getIronSession(req, res, SESSION_OPTIONS);
  if (!session.googleTokens) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { drive, auth } = getDriveClient(session.googleTokens);
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
    if (err.message?.includes('insufficient authentication scopes') || err.code === 403) {
      const session = await getIronSession(req, res, SESSION_OPTIONS);
      session.googleTokens = undefined;
      await session.save();
      return res.status(401).json({ error: 'insufficient_scope' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/drive/upload', upload.single('file'), async (req, res) => {
  const session = await getIronSession(req, res, SESSION_OPTIONS);
  if (!session.googleTokens) return res.status(401).json({ error: 'Not authenticated' });
  if (!req.file)             return res.status(400).json({ error: 'No file provided' });

  try {
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
});

app.delete('/api/drive/files/:id', async (req, res) => {
  const session = await getIronSession(req, res, SESSION_OPTIONS);
  if (!session.googleTokens) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { drive } = getDriveClient(session.googleTokens);
    await drive.files.delete({ fileId: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const WORKSPACE_EXPORTS = {
  'application/vnd.google-apps.document':     { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  ext: '.docx' },
  'application/vnd.google-apps.spreadsheet':  { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',        ext: '.xlsx' },
  'application/vnd.google-apps.presentation': { mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', ext: '.pptx' },
  'application/vnd.google-apps.drawing':      { mime: 'application/pdf',  ext: '.pdf'  },
  'application/vnd.google-apps.script':       { mime: 'application/json', ext: '.json' },
};

app.get('/api/drive/files/:id/download', async (req, res) => {
  const session = await getIronSession(req, res, SESSION_OPTIONS);
  if (!session.googleTokens) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { drive } = getDriveClient(session.googleTokens);
    const { name, mimeType } = (await drive.files.get({ fileId: req.params.id, fields: 'name,mimeType' })).data;

    if (mimeType === 'application/vnd.google-apps.folder') {
      return res.status(400).json({ error: 'Папки нельзя скачать' });
    }

    const exportInfo = WORKSPACE_EXPORTS[mimeType];
    const filename = exportInfo ? name + exportInfo.ext : name;

    const dl = exportInfo
      ? await drive.files.export({ fileId: req.params.id, mimeType: exportInfo.mime }, { responseType: 'stream' })
      : await drive.files.get({ fileId: req.params.id, alt: 'media' }, { responseType: 'stream' });

    const chunks = [];
    await new Promise((resolve, reject) => {
      dl.data.on('data', c => chunks.push(c));
      dl.data.on('end', resolve);
      dl.data.on('error', reject);
    });
    const buffer = Buffer.concat(chunks);

    res.setHeader('Content-Type', exportInfo ? exportInfo.mime : mimeType);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports.handler = serverless(app);
