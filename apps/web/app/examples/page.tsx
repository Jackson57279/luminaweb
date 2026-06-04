import type { Metadata } from "next";
import { examplesBody } from "@/lib/content";

export const metadata: Metadata = {
  title: "Examples",
  description: "Cookbook of Luminaweb capsules: todo, guestbook, chat, counter, webhook, blank.",
  alternates: { canonical: "/examples" },
};

export default function Page() {
  return <div dangerouslySetInnerHTML={{ __html: examplesBody }} />;
}
