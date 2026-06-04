function json(body: unknown) {
  return new Response(JSON.stringify(body, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export function GET() {
  return json({
    name: "Luminaweb Docs",
    url: "https://luminaweb.app/docs",
    description: "Public alpha documentation for Luminaweb, an agent-native CLI and runtime for full-stack TypeScript apps.",
    sourceRepository: "https://github.com/luminaweb/luminaweb",
    agentEntrypoints: { manifest: "/docs.json", llms: "/llms.txt", llmsFull: "/llms-full.txt" },
    pages: [
      { title: "Luminaweb Docs", url: "/docs" },
      { title: "Quickstart", url: "/docs/quickstart" },
      { title: "Reference", url: "/docs/reference" },
      { title: "Capsule API", url: "/docs/capsule-api" },
      { title: "CLI", url: "/docs/cli" },
      { title: "Deploy", url: "/docs/deploy" },
    ],
  });
}
