import { claimDeploy, verifyBearer } from "@/lib/platform";

export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authn = verifyBearer(req);
  if (!authn) return json({ error: "invalid_token" }, 401);
  const { id } = await params;
  if (!id) return json({ error: "missing_deploy_id" }, 400);
  if (!claimDeploy(id, authn.userId)) return json({ error: "deploy_not_found" }, 404);
  return json({ ok: true, id });
}
