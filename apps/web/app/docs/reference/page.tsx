import type { Metadata } from "next";
import { docsReferenceBody } from "@/lib/content";

export const metadata: Metadata = {
  title: "Reference",
  description: "Capsule runtime, server, data, client, auth, env, and deploy reference.",
  alternates: { canonical: "/docs/reference" },
};

export default function Page() {
  return <div dangerouslySetInnerHTML={{ __html: docsReferenceBody }} />;
}
