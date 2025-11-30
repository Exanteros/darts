import { useSession } from 'next-auth/react';

export function useAdminCheck() {
  const { data: session, status } = useSession();

  const isAdmin = session?.user?.role === 'ADMIN';
  const isLoading = status === 'loading';
  const isAuthenticated = !!session?.user;

  return {
    isAdmin,
    isLoading,
    isAuthenticated,
    user: session?.user,
    hasAccess: isAuthenticated && isAdmin
  };
}
