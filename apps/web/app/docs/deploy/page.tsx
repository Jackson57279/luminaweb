import type { Metadata } from "next";
import { docsDeployBody } from "@/lib/content";

export const metadata: Metadata = {
  title: "Deploy",
  description: "Build, deploy, claim, and inspect a Luminaweb capsule on the edge.",
  alternates: { canonical: "/docs/deploy" },
};

export default function Page() {
  return <div dangerouslySetInnerHTML={{ __html: docsDeployBody }} />;
}
