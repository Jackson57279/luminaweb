import { serveDeploy } from "@/lib/platform";

export const dynamic = "force-dynamic";

async function handleDeploy(
  req: Request,
  { params }: { params: Promise<{ id: string; path?: string[] }> },
) {
  const { id, path } = await params;
  const rest = path && path.length ? `/${path.join("/")}` : "/";
  return serveDeploy(req, id, rest);
}

export const GET = handleDeploy;
export const POST = handleDeploy;
export const PUT = handleDeploy;
export const PATCH = handleDeploy;
export const DELETE = handleDeploy;
