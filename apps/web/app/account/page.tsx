import type { Metadata } from "next";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { listDeploys } from "@/lib/platform";
import { AccountClient } from "@/components/account-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Account",
  description: "Connect Luminaweb CLI deploys to your account.",
  alternates: { canonical: "/account" },
};

export default async function AccountPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user ?? null;
  const deploys = user ? listDeploys(user.id).map((d) => ({ id: d.id, name: d.name })) : [];
  return <AccountClient user={user ? { email: user.email } : null} deploys={deploys} />;
}
