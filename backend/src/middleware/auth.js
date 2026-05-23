import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const DEV_SUBS = new Set(['local-user-sub', 'local-admin-sub']);

function isDevAuth(token) {
  return process.env.NODE_ENV === 'development' && DEV_SUBS.has(token);
}

const issuer = process.env.JWT_ISSUER;
const client = issuer
  ? jwksClient({ jwksUri: `${issuer}/.well-known/jwks.json` })
  : null;

function getKey(header, callback) {
  if (!client) return callback(new Error('JWT issuer not configured'));
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
}

export function requireAuth(req, res, next) {
  const token = req.cookies?.auth_token;

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (isDevAuth(token)) {
    req.user = { sub: token };
    return next();
  }

  if (!client) {
    return res.status(503).json({ error: 'Auth not configured' });
  }

  jwt.verify(
    token,
    getKey,
    {
      audience: process.env.JWT_AUDIENCE,
      issuer: process.env.JWT_ISSUER,
    },
    (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
      req.user = decoded;
      next();
    }
  );
}
