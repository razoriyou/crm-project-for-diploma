const { google } = require('googleapis');

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

module.exports = { makeOAuth2Client, getDriveClient };
