export function execFileSync(..._args: unknown[]): never {
  void _args;
  throw new Error("execFileSync is unavailable in browser builds. This module is server-only.");
}
