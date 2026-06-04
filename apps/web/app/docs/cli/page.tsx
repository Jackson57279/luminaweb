import type { Metadata } from "next";
import { docsCliBody } from "@/lib/content";

export const metadata: Metadata = {
  title: "CLI",
  description: "Every command, every flag for the Luminaweb CLI.",
  alternates: { canonical: "/docs/cli" },
};

export default function Page() {
  return <div dangerouslySetInnerHTML={{ __html: docsCliBody }} />;
}
