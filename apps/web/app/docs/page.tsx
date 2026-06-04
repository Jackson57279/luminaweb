import type { Metadata } from "next";
import { docsBody } from "@/lib/content";

export const metadata: Metadata = {
  title: "Luminaweb Docs",
  description: "Luminaweb is an agent-native CLI and runtime for full-stack TypeScript apps.",
  alternates: { canonical: "/docs" },
};

export default function DocsPage() {
  return <div dangerouslySetInnerHTML={{ __html: docsBody }} />;
}
