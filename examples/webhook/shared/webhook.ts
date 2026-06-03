export type Hit = {
  id: string;
  source: string;
  body: unknown;
  receivedAt: string;
  createdAt: string;
  updatedAt: string;
};

export function isAuthorized(headers: Headers, expected: string | undefined): boolean {
  if (!expected) return false;
  const got = headers.get("x-webhook-secret") ?? "";
  if (got.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ got.charCodeAt(i);
  }
  return diff === 0;
}
