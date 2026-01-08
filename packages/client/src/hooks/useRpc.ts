import { useState, useCallback } from 'react';
import { api } from '../services/rpcClient';

export function useRpc() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await fn();
        return result;
      } catch (e: any) {
        setError(e.message || 'An error occurred');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { loading, error, execute, api };
}
