export function generateRuntimeUuid(): string {
  if (typeof globalThis.crypto !== "undefined" && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `local-${Math.random().toString(16).slice(2)}-${Date.now().toString(36)}-${Math.trunc(Math.random() * 1e9)}`;
}
