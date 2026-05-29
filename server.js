const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// Serve the CRA production build
app.use(express.static(path.join(__dirname, 'build')));

// SPA fallback — Express 5 wildcard syntax; lets state-based routing handle all paths
app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`CRM running on port ${PORT}`);
});
