/* global AbortController, clearTimeout, fetch, setTimeout */

export function requestId() {
  return `wss_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function timeoutErrorMessage(error) {
  return error?.name === "AbortError" ? "provider_timeout" : "provider_failed";
}

export async function fetchJsonWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    const body = await response.json().catch(() => ({}));
    return { response, body };
  } finally {
    clearTimeout(timer);
  }
}

export function withTimeout(promise, timeoutMs, message = "operation_timeout") {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error(message);
      error.name = "TimeoutError";
      reject(error);
    }, timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
