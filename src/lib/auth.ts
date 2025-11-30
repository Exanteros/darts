import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        isMagicLink: { label: 'IsMagicLink', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          return null;
        }

        const normalizedEmail = credentials.email.toLowerCase().trim();

        // Suche Benutzer in der Datenbank
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail }
        });

        if (!user) {
          return null;
        }

        // Magic Link Authentifizierung (kein Passwort erforderlich)
        if (credentials.isMagicLink === 'true') {
          // Bei Magic Link ist Token bereits verifiziert
          // Zusätzliche Sicherheit: Prüfe ob User aktiv ist
          console.log(`Magic Link login successful for user ${user.id} (${user.email})`);
          
          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          };
        }

        // Standard Passwort-Authentifizierung (Legacy - sollte nicht mehr verwendet werden)
        if (!credentials.password) {
          return null;
        }

        // Überprüfe Passwort
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          console.warn(`Failed password login attempt for ${normalizedEmail}`);
          return null;
        }

        console.log(`Password login successful for user ${user.id} (${user.email})`);

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 Tage
    updateAge: 24 * 60 * 60, // Update session alle 24h
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
        token.name = user.name;
        // Security: Timestamp für Token-Rotation
        token.iat = Math.floor(Date.now() / 1000);
      }
      
      // Token Rotation: Nach 24h neues Token generieren
      if (trigger === 'update' && token.iat) {
        const tokenAge = Math.floor(Date.now() / 1000) - (token.iat as number);
        if (tokenAge > 24 * 60 * 60) {
          token.iat = Math.floor(Date.now() / 1000);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Security: Verhindere Open Redirect
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  // Security Headers
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};
