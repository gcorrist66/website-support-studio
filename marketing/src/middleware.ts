export async function onRequest(context: any, next: () => Promise<Response>) {
  const response = await next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return response;
}
