import type { Metadata } from "next";
import { playgroundBody } from "@/lib/content";

export const metadata: Metadata = {
  title: "Playground",
  description: "A live Luminaweb capsule running in your browser.",
  alternates: { canonical: "/playground" },
};

export default function Page() {
  return <div dangerouslySetInnerHTML={{ __html: playgroundBody }} />;
}
