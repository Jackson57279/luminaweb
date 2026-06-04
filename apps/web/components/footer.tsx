export function Footer() {
  return (
    <footer className="foot">
      <div className="foot__inner">
        <div className="foot__brand">
          luminaweb
          <span className="foot__sub">An agent-native runtime for full-stack TypeScript apps.</span>
        </div>
        <div className="foot__cols">
          <div>
            <h4>Product</h4>
            <a href="/docs">Docs</a>
            <a href="/examples">Examples</a>
            <a href="/playground">Playground</a>
            <a href="/docs/deploy">Deploy</a>
          </div>
          <div>
            <h4>Reference</h4>
            <a href="/docs/reference">Reference</a>
            <a href="/docs/capsule-api">Capsule API</a>
            <a href="/docs/cli">CLI</a>
            <a href="/llms.txt">llms.txt</a>
          </div>
          <div>
            <h4>Connect</h4>
            <a href="https://github.com/luminaweb/luminaweb">GitHub</a>
            <a href="https://x.com/luminaweb">X / Twitter</a>
            <a href="mailto:hi@luminaweb.app">hi@luminaweb.app</a>
          </div>
        </div>
        <div className="foot__base">
          <span>© 2026 Luminaweb</span>
          <span>v0.1.0 · built on Bun · deployed on Railway Edge</span>
        </div>
      </div>
    </footer>
  );
}
