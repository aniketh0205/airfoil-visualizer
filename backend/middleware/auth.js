const crypto = require('crypto');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'thor343';
const TOKEN_VALIDITY_MS = 24 * 60 * 60 * 1000;

const tokens = new Map();

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function login(req, res) {
  const { password } = req.body;
  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  const token = generateToken();
  tokens.set(token, Date.now());
  res.json({ token, message: 'Login successful' });
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const token = authHeader.split(' ')[1];
  const timestamp = tokens.get(token);
  if (!timestamp) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  if (Date.now() - timestamp > TOKEN_VALIDITY_MS) {
    tokens.delete(token);
    return res.status(401).json({ error: 'Token expired' });
  }
  next();
}

module.exports = { login, requireAuth };
