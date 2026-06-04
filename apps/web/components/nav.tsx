"use client";

import { usePathname } from "next/navigation";

export function Nav() {
  const pathname = usePathname();
  const current = (match: boolean) => (match ? { "data-current": "true" } : {});
  return (
    <header className="nav">
      <div className="nav__inner">
        <a className="nav__brand" href="/">
          luminaweb
          <span className="nav__tag">alpha</span>
        </a>
        <nav className="nav__links" aria-label="Primary">
          <a href="/docs" {...current(pathname.startsWith("/docs"))}>Docs</a>
          <a href="/examples" {...current(pathname === "/examples")}>Examples</a>
          <a href="/playground" {...current(pathname === "/playground")}>Playground</a>
          <a href="/docs/deploy" {...current(pathname === "/docs/deploy")}>Deploy</a>
        </nav>
        <a className="nav__cta" href="/account">Account</a>
      </div>
    </header>
  );
}
