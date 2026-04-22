import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const SECRET = process.env.JWT_SECRET || 'dev-fallback-secret';
const EXPIRES_IN: jwt.SignOptions['expiresIn'] = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, SECRET) as { userId: string };
    return payload.userId;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
