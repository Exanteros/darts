import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('Missing NEXTAUTH_SECRET environment variable. Set NEXTAUTH_SECRET to a secure random value.');
}

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

export interface SessionUser {
  userId: string;
  email: string;
  name: string | null;
  role: string;
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({
    userId: user.userId,
    email: user.email,
    name: user.name,
    role: user.role
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    if (!sessionToken) {
      return null;
    }

    // Verifiziere und decode JWT
    const { payload } = await jwtVerify(sessionToken, JWT_SECRET);

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string | null,
      role: payload.role as string
    };
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  
  if (!session) {
    throw new Error('Unauthorized');
  }
  
  return session;
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireAuth();
  
  if (session.role !== 'ADMIN') {
    throw new Error('Forbidden');
  }
  
  return session;
}
