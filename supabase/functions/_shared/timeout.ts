/* global AbortController, Request, RequestInit, Response, URL, clearTimeout, crypto, fetch, setTimeout */

export function requestId(): string {
  return `wss_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`;
}

export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message = "operation_timeout"): Promise<T> {
  let timer = 0;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchWithTimeout(input: string | URL | Request, init: RequestInit = {}, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
