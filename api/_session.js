const SESSION_OPTIONS = {
  cookieName: 'crm_gdrive',
  password: process.env.SESSION_SECRET,
  cookieOptions: {
    secure:   process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 7, // 7 days
  },
};

module.exports = { SESSION_OPTIONS };
