import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

/**
 * Server-Side Authentication Check
 * Redirects unauthenticated users to login page
 * Use in Server Components
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect('/login');
  }
  
  return session;
}

/**
 * Server-Side Admin Check
 * Redirects non-admin users to user dashboard
 * Use in Server Components for admin-only pages
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect('/login');
  }
  
  if (session.user.role !== 'ADMIN') {
    redirect('/user');
  }
  
  return session;
}
