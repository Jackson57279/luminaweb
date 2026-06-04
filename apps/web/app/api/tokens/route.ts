import { getSessionUser } from "@/lib/auth";
import { createToken } from "@/lib/platform";

export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return json({ error: "not_authenticated" }, 401);
  let body: { name?: string } | null = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }
  const token = createToken(user.id, body?.name ?? "CLI token");
  return json({ token });
}
