require('dotenv').config();
const express  = require('express');
const path     = require('path');
const session  = require('express-session');
const multer   = require('multer');
const { google } = require('googleapis');
const { Readable } = require('stream');

const app    = express();
const PORT   = process.env.PORT || 3000;
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'crm-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

function makeOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
}

function getDriveClient(req) {
  const auth = makeOAuth2Client();
  auth.setCredentials(req.session.googleTokens);
  auth.on('tokens', (tokens) => {
    req.session.googleTokens = { ...req.session.googleTokens, ...tokens };
  });
  return google.drive({ version: 'v3', auth });
}

// ── Auth ──────────────────────────────────────────────────────────────────────

app.get('/api/auth/google', (_req, res) => {
  const url = makeOAuth2Client().generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/drive'],
  });
  res.redirect(url);
});

app.get('/api/auth/google/callback', async (req, res) => {
  try {
    const { tokens } = await makeOAuth2Client().getToken(req.query.code);
    req.session.googleTokens = tokens;
    res.redirect('/?drive=connected');
  } catch {
    res.redirect('/?drive=error');
  }
});

app.get('/api/auth/status', (req, res) => {
  res.json({ connected: !!req.session.googleTokens });
});

app.delete('/api/auth/google', (req, res) => {
  delete req.session.googleTokens;
  res.json({ ok: true });
});

// ── Drive ─────────────────────────────────────────────────────────────────────

app.get('/api/drive/files', async (req, res) => {
  if (!req.session.googleTokens) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const drive    = getDriveClient(req);
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
});

app.post('/api/drive/upload', upload.single('file'), async (req, res) => {
  if (!req.session.googleTokens) return res.status(401).json({ error: 'Not authenticated' });
  if (!req.file)                 return res.status(400).json({ error: 'No file provided' });
  try {
    const drive  = getDriveClient(req);
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

// ── Static ────────────────────────────────────────────────────────────────────

app.use(express.static(path.join(__dirname, 'build')));

app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`CRM running on port ${PORT}`);
});
