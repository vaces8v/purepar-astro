import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = import.meta.env.AUTH_SECRET || process.env.AUTH_SECRET || 'default-secret-change-me';
const ADMIN_EMAIL = import.meta.env.ADMIN_EMAIL || process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = import.meta.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
const ADMIN_PASSWORD_HASH = import.meta.env.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD_HASH;

export interface AdminUser {
  email: string;
}

export async function validateCredentials(email: string, password: string): Promise<boolean> {
  if (email !== ADMIN_EMAIL) {
    return false;
  }

  if (ADMIN_PASSWORD_HASH) {
    return bcrypt.compareSync(password, ADMIN_PASSWORD_HASH);
  }

  return password === ADMIN_PASSWORD;
}

export function createToken(user: AdminUser): string {
  return jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AdminUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
    return { email: decoded.email };
  } catch {
    return null;
  }
}

export function getSessionFromCookie(cookieHeader: string | null): AdminUser | null {
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  const token = cookies['admin_token'];
  if (!token) return null;

  return verifyToken(token);
}

export function createAuthCookie(token: string): string {
  const maxAge = 7 * 24 * 60 * 60; // 7 days
  return `admin_token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`;
}

export function clearAuthCookie(): string {
  return 'admin_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0';
}
