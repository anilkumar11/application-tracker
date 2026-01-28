import { useState, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';
import { withRetry, parseSupabaseError } from '../lib/apiHelpers';

interface UseApiOptions {
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
  retry?: boolean;
}

export function useApi<T extends (...args: any[]) => Promise<any>>(
  apiFunction: T,
  options: UseApiOptions = {}
) {
  const {
    showSuccessToast = false,
    showErrorToast = true,
    successMessage,
    errorMessage,
    retry = true,
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const execute = useCallback(
    async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>> | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = retry
          ? await withRetry(() => apiFunction(...args))
          : await apiFunction(...args);

        if (showSuccessToast && successMessage) {
          toast.success(successMessage);
        }

        return result;
      } catch (err) {
        const errorMsg = parseSupabaseError(err);
        setError(errorMsg);

        if (showErrorToast) {
          toast.error(errorMessage || errorMsg);
        }

        return null;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction, showSuccessToast, showErrorToast, successMessage, errorMessage, retry, toast]
  );

  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
  }, []);

  return {
    execute,
    loading,
    error,
    reset,
  };
}
