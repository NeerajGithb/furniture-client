interface FetchOptions extends RequestInit {
  skipRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

interface RetryState {
  isRefreshing: boolean;
  refreshPromise: Promise<boolean> | null;
}

const retryState: RetryState = {
  isRefreshing: false,
  refreshPromise: null,
};

async function refreshAccessToken(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function handleTokenRefresh(): Promise<boolean> {
  if (retryState.isRefreshing && retryState.refreshPromise) {
    return retryState.refreshPromise;
  }

  retryState.isRefreshing = true;
  retryState.refreshPromise = refreshAccessToken();

  try {
    const result = await retryState.refreshPromise;
    return result;
  } finally {
    retryState.isRefreshing = false;
    retryState.refreshPromise = null;
  }
}

export async function fetchWithCredentials(
  input: RequestInfo,
  init?: FetchOptions,
): Promise<Response> {
  const { skipRetry = false, maxRetries = 1, retryDelay = 100, ...restInit } = init || {};

  const options: RequestInit = {
    ...restInit,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...restInit.headers,
    },
  };

  let lastResponse: Response;
  let retryCount = 0;

  while (retryCount <= maxRetries) {
    try {
      const response = await fetch(input, options);
      lastResponse = response;

      if (response.ok) {
        return response;
      }

      if (response.status === 401 && !skipRetry && retryCount < maxRetries) {
        const url = typeof input === 'string' ? input : input.url;
        if (url.includes('/api/auth/refresh') || url.includes('/api/auth/logout')) {
          return response;
        }

        const refreshed = await handleTokenRefresh();

        if (refreshed) {
          retryCount++;
          if (retryDelay > 0) {
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          }
          continue;
        }
      }

      return response;
    } catch {
      if (retryCount < maxRetries && !skipRetry) {
        retryCount++;
        if (retryDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
        continue;
      }

      lastResponse = new Response(JSON.stringify({ error: 'Network error', success: false }), {
        status: 500,
        statusText: 'Internal Server Error',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return lastResponse;
    }
  }

  return lastResponse!;
}

export async function fetchWithCredentialsSimple(
  input: RequestInfo,
  init?: RequestInit,
): Promise<Response> {
  const options: RequestInit = {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  };

  try {
    return await fetch(input, options);
  } catch {
    return new Response(JSON.stringify({ error: 'Network error', success: false }), {
      status: 500,
      statusText: 'Internal Server Error',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function fetchWithCredentialsBackoff(
  input: RequestInfo,
  init?: FetchOptions & { baseDelay?: number },
): Promise<Response> {
  const { maxRetries = 3, baseDelay = 1000, skipRetry = false, ...restInit } = init || {};

  let retryCount = 0;

  while (retryCount <= maxRetries) {
    try {
      const response = await fetchWithCredentials(input, {
        ...restInit,
        skipRetry: retryCount > 0,
        maxRetries: 0,
      });

      if (response.ok || skipRetry || ![401, 500, 502, 503, 504].includes(response.status)) {
        return response;
      }

      if (retryCount < maxRetries) {
        const delay = baseDelay * Math.pow(2, retryCount) + Math.random() * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      retryCount++;
    } catch {
      if (retryCount >= maxRetries) {
        return new Response(JSON.stringify({ error: 'Max retries exceeded', success: false }), {
          status: 500,
          statusText: 'Internal Server Error',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      const delay = baseDelay * Math.pow(2, retryCount) + Math.random() * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      retryCount++;
    }
  }

  return new Response(JSON.stringify({ error: 'Max retries exceeded', success: false }), {
    status: 500,
    statusText: 'Internal Server Error',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export function isLikelyLoggedOut(response: Response): boolean {
  return response.status === 401 && !response.url.includes('/api/auth/');
}

export async function handleApiResponse<T = any>(response: Response): Promise<T> {
  try {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        success: false,
      } as T;
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return await response.json();
    }

    return (await response.text()) as any;
  } catch {
    return { error: 'Response parsing failed', success: false } as T;
  }
}
