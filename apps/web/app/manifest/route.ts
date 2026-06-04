function json(body: unknown) {
  return new Response(JSON.stringify(body, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export function GET() {
  return json({
    name: "Luminaweb",
    url: "https://luminaweb.app",
    description: "Luminaweb is an alpha-stage agent-native CLI and runtime for full-stack TypeScript apps.",
    sourceRepository: "https://github.com/luminaweb/luminaweb",
    agentEntrypoints: {
      manifest: "/docs.json",
      llms: "/llms.txt",
      llmsFull: "/llms-full.txt",
    },
    pages: [
      { title: "Luminaweb Docs", section: "Docs", url: "/docs" },
      { title: "Quickstart", section: "Docs", url: "/docs/quickstart" },
      { title: "Reference", section: "Docs", url: "/docs/reference" },
      { title: "Capsule API", section: "Docs", url: "/docs/capsule-api" },
      { title: "CLI", section: "Docs", url: "/docs/cli" },
      { title: "Deploy", section: "Docs", url: "/docs/deploy" },
      { title: "Examples", section: "Examples", url: "/examples" },
    ],
  });
}
