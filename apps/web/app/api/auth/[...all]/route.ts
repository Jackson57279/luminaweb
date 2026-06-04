import { auth, ensureAuthMigrations } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function handler(req: Request) {
  await ensureAuthMigrations();
  return auth.handler(req);
}

export { handler as GET, handler as POST };
