export function GET() {
  return new Response(
    `# Luminaweb

> Luminaweb is an alpha-stage agent-native CLI and runtime for full-stack TypeScript apps.

## Docs

- [Luminaweb Docs](https://luminaweb.app/docs)
- [Quickstart](https://luminaweb.app/docs/quickstart)
- [Reference](https://luminaweb.app/docs/reference)
- [Capsule API](https://luminaweb.app/docs/capsule-api)
- [CLI](https://luminaweb.app/docs/cli)
- [Deploy](https://luminaweb.app/docs/deploy)

## Machine-readable

- [docs.json](https://luminaweb.app/docs.json)
- [llms-full.txt](https://luminaweb.app/llms-full.txt)
`,
    { headers: { "content-type": "text/plain; charset=utf-8" } },
  );
}
