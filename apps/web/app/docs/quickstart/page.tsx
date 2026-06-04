import type { Metadata } from "next";
import { docsQuickstartBody } from "@/lib/content";

export const metadata: Metadata = {
  title: "Quickstart",
  description: "Install Luminaweb, scaffold a capsule, run it locally, deploy it.",
  alternates: { canonical: "/docs/quickstart" },
};

export default function Page() {
  return <div dangerouslySetInnerHTML={{ __html: docsQuickstartBody }} />;
}
