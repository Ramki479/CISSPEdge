import { useCallback, useState } from 'react';

/**
 * useAsyncError — lets async code bubble errors into the React error boundary.
 *
 * Usage:
 *   const { throwError } = useAsyncError();
 *   try { await db.something(); } catch (err) { throwError(err); }
 */
export function useAsyncError() {
  const [, setError] = useState<Error | null>(null);

  const throwError = useCallback((err: unknown) => {
    setError(() => {
      throw err instanceof Error ? err : new Error(String(err));
    });
  }, []);

  return { throwError };
}
