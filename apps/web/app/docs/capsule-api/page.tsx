import type { Metadata } from "next";
import { docsCapsuleApiBody } from "@/lib/content";

export const metadata: Metadata = {
  title: "Capsule API",
  description: "The API shape an agent uses when authoring a Luminaweb capsule.",
  alternates: { canonical: "/docs/capsule-api" },
};

export default function Page() {
  return <div dangerouslySetInnerHTML={{ __html: docsCapsuleApiBody }} />;
}
