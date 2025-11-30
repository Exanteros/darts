import { useState, useCallback } from 'react';

export function useButtonLoading() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const withLoading = useCallback(
    <T extends any[]>(
      key: string,
      asyncFn: (...args: T) => Promise<void>,
      loadingText?: string
    ) => {
      return async (...args: T) => {
        setLoadingStates((prev) => ({ ...prev, [key]: true }));
        try {
          await asyncFn(...args);
        } finally {
          setLoadingStates((prev) => ({ ...prev, [key]: false }));
        }
      };
    },
    []
  );

  const isLoading = useCallback(
    (key: string) => loadingStates[key] || false,
    [loadingStates]
  );

  return { withLoading, isLoading };
}
