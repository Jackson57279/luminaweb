import type { Metadata } from "next";
import { homeBody } from "@/lib/content";

export const metadata: Metadata = {
  title: "Ship the thing. Skip the plumbing.",
  description:
    "Luminaweb is an agent-native runtime for full-stack TypeScript apps. One directory, one port, one command. Deployed to the edge.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <div dangerouslySetInnerHTML={{ __html: homeBody }} />;
}
