import { SignJWT, jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

export async function signLoginToken(payload: { email: string; userId: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2m') // Token valid for 2 minutes
    .sign(SECRET);
}

export async function verifyLoginToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { email: string; userId: string };
  } catch (e) {
    return null;
  }
}
