import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface TournamentAccess {
  tournamentId: string;
  tournamentName: string;
  role: string;
  permissions: any;
}

interface AccessCheckResult {
  hasAccess: boolean;
  isGlobalAdmin: boolean;
  tournamentAccess: TournamentAccess[];
}

export function useTournamentAccess() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [accessData, setAccessData] = useState<AccessCheckResult | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await fetch('/api/auth/check-access', {
          credentials: 'include',
          cache: 'no-store'
        });

        if (response.ok) {
          const data = await response.json();
          setAccessData(data);

          // Wenn kein Zugriff, weiterleiten
          if (!data.hasAccess) {
            router.push('/user');
          }
        } else {
          // Bei Fehler auch weiterleiten
          router.push('/login');
        }
      } catch (error) {
        console.error('Access check error:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [router]);

  const isAdmin = accessData?.isGlobalAdmin || false;
  const hasTournamentAccess = accessData?.hasAccess || false;
  const tournamentAccess = accessData?.tournamentAccess || [];

  const checkPermission = (category: string, action: string) => {
    if (isAdmin) return true;
    return tournamentAccess.some(access => {
      try {
        const permissions = typeof access.permissions === 'string' 
          ? JSON.parse(access.permissions || '{}') 
          : access.permissions || {};
        return permissions[category]?.[action] === true;
      } catch (e) {
        console.error('Error parsing permissions:', e);
        return false;
      }
    });
  };

  return {
    isAdmin,
    hasTournamentAccess,
    tournamentAccess,
    isLoading,
    isAuthenticated: !!accessData,
    checkPermission,
    canViewLive: checkPermission('live', 'view')
  };
}