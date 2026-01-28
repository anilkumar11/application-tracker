import { API_RETRY } from './constants';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    backoffMultiplier?: number;
    shouldRetry?: (error: unknown) => boolean;
  } = {}
): Promise<T> {
  const {
    maxAttempts = API_RETRY.maxAttempts,
    delay = API_RETRY.delay,
    backoffMultiplier = API_RETRY.backoffMultiplier,
    shouldRetry = (error) => {
      if (error && typeof error === 'object' && 'code' in error) {
        const code = (error as { code: string }).code;
        return ['PGRST301', '408', '429', '500', '502', '503', '504'].includes(code);
      }
      return true;
    },
  } = options;

  let lastError: unknown;
  let currentDelay = delay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts || !shouldRetry(error)) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, currentDelay));
      currentDelay *= backoffMultiplier;
    }
  }

  throw lastError;
}

export function parseSupabaseError(error: unknown): string {
  if (!error) return 'An unknown error occurred';

  if (typeof error === 'object') {
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }

    if ('error' in error && typeof error.error === 'string') {
      return error.error;
    }

    if ('error_description' in error && typeof error.error_description === 'string') {
      return error.error_description;
    }
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
}

export function handleApiError(error: unknown): never {
  const message = parseSupabaseError(error);
  throw new ApiError(message, undefined, error);
}
