import { serveDeploy } from "@/lib/platform";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; path?: string[] }> },
) {
  const { id, path } = await params;
  const rest = path && path.length ? `/${path.join("/")}` : "/";
  return serveDeploy(req, id, rest);
}
