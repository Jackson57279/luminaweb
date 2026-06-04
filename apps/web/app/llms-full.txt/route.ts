import {
  docsBody,
  docsQuickstartBody,
  docsReferenceBody,
  docsCapsuleApiBody,
  docsCliBody,
  docsDeployBody,
} from "@/lib/content";

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function GET() {
  const blocks = [
    docsBody,
    docsQuickstartBody,
    docsReferenceBody,
    docsCapsuleApiBody,
    docsCliBody,
    docsDeployBody,
  ].map(stripHtml);
  return new Response(`# Luminaweb — full text\n\n${blocks.join("\n\n---\n\n")}\n`, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
