import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface User {
  userId: string;
  email: string;
  name: string | null;
  role: string;
}

export function useUserCheck() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
          cache: 'no-store'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUser(data.user);
          } else {
            router.push('/login');
          }
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Session check error:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [router]);

  const isAdmin = user?.role === 'ADMIN';
  const isAuthenticated = !!user;

  return {
    isAdmin,
    isLoading,
    isAuthenticated,
    user,
    shouldRedirect: !isLoading && !isAuthenticated
  };
}
