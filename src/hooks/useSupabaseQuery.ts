import { useEffect, useState } from 'react';

type QueryStatus = 'idle' | 'loading' | 'success' | 'error';

interface UseSupabaseQueryResult<T> {
  data: T | null;
  status: QueryStatus;
  error: string | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}

export function useSupabaseQuery<T>(
  queryFn: () => Promise<T>
): UseSupabaseQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<QueryStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function executeQuery() {
      setStatus('loading');
      setError(null);

      try {
        const result = await queryFn();

        if (!isCancelled) {
          setData(result);
          setStatus('success');
        }
      } catch (err) {
        if (!isCancelled) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          setError(errorMessage);
          setStatus('error');
        }
      }
    }

    executeQuery();

    return () => {
      isCancelled = true;
    };
  }, []);

  return {
    data,
    status,
    error,
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
  };
}
