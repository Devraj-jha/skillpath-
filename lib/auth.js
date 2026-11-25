import { createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'skillpath_session';
const TTL_SECONDS = 60 * 60 * 24 * 7;
const secret = () => {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    const error = new Error('Set SESSION_SECRET in your deployment environment before enabling sign-in.');
    error.status = 503;
    throw error;
  }
  return 'skillpath-local-development-secret-change-me';
};

function encode(value) { return Buffer.from(value).toString('base64url'); }
function signature(payload) { return createHmac('sha256', secret()).update(payload).digest('base64url'); }

export function createSessionCookie(user) {
  const payload = encode(JSON.stringify({ sub: user.id, role: user.role, exp: Math.floor(Date.now() / 1000) + TTL_SECONDS }));
  const token = `${payload}.${signature(payload)}`;
  const secure = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${TTL_SECONDS}${secure ? '; Secure' : ''}`;
}

export function clearSessionCookie() {
  const secure = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  return `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`;
}

export function readSession(req) {
  const raw = req.headers.cookie || '';
  const value = raw.split(';').map(part => part.trim()).find(part => part.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1);
  if (!value) return null;
  const [payload, supplied] = value.split('.');
  if (!payload || !supplied) return null;
  let expected;
  try { expected = signature(payload); } catch { return null; }
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!session.sub || !session.role || session.exp < Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch { return null; }
}

export function requireRole(req, role = 'student') {
  const session = readSession(req);
  if (!session) {
    const error = new Error('Please sign in to continue.');
    error.status = 401;
    throw error;
  }
  if (role && session.role !== role && session.role !== 'admin') {
    const error = new Error('You do not have permission to access this resource.');
    error.status = 403;
    throw error;
  }
  return session;
}
