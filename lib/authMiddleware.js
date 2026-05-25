import jwt from 'jsonwebtoken';

export function verifyAdmin(req) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) throw new Error('No token');
  return jwt.verify(token, process.env.JWT_SECRET); // throws if invalid
}
