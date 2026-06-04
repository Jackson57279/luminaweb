import { saveDeploy, verifyBearer, type DistFile } from "@/lib/platform";

export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export async function POST(req: Request) {
  const authn = verifyBearer(req);
  if (!authn) return json({ error: "invalid_token" }, 401);
  let body: { name?: string; public?: boolean; files?: DistFile[] } | null = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }
  if (!body?.files?.length) return json({ error: "missing_files" }, 400);
  if (!body.files.some((f) => f.path === "manifest.json")) return json({ error: "missing_manifest" }, 400);
  if (!body.files.some((f) => f.path === "server.mjs")) return json({ error: "missing_server" }, 400);
  if (!body.files.some((f) => f.path === "client/index.html")) return json({ error: "missing_client_html" }, 400);
  if (!body.files.some((f) => f.path === "client/bundle.js")) return json({ error: "missing_client_bundle" }, 400);
  const id = saveDeploy({
    name: body.name ?? "capsule",
    files: body.files,
    ownerId: authn.userId,
    isPublic: body.public !== false,
  });
  const origin = new URL(req.url).origin;
  return json({ id, url: `${origin}/d/${id}`, claim: `luminaweb claim ${id}` });
}
