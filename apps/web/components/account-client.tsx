"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DeploySummary = { id: string; name: string };
type SessionUser = { email: string };

export function AccountClient({
  user,
  deploys,
}: {
  user: SessionUser | null;
  deploys: DeploySummary[];
}) {
  return (
    <div className="mx-auto w-full max-w-md py-16">
      {user ? <SignedIn user={user} deploys={deploys} /> : <SignedOut />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Signed-out — sign in / create account                              */
/* ------------------------------------------------------------------ */

function SignedOut() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const path = mode === "sign-up" ? "/api/auth/sign-up/email" : "/api/auth/sign-in/email";
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        window.location.href = "/account";
        return;
      }
      setError("Auth failed. Check the email and password.");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <span className="tag tag--green" style={{ alignSelf: "flex-start", marginBottom: 4 }}>
          <span className="tag__dot" />account
        </span>
        <CardTitle>{mode === "sign-in" ? "Sign in" : "Create account"}</CardTitle>
        <CardDescription>
          Sign in, create a CLI token, then deploy and claim capsules from your machine.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex gap-1 rounded-[8px] border border-border bg-muted p-1">
          <ModeTab active={mode === "sign-in"} onClick={() => { setMode("sign-in"); setError(""); }}>
            Sign in
          </ModeTab>
          <ModeTab active={mode === "sign-up"} onClick={() => { setMode("sign-up"); setError(""); }}>
            Create account
          </ModeTab>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          {mode === "sign-up" && (
            <Field label="Name" htmlFor="name">
              <Input id="name" name="name" required autoComplete="name" placeholder="Ada Lovelace" />
            </Field>
          )}
          <Field label="Email" htmlFor="email">
            <Input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
          </Field>
          <Field label="Password" htmlFor="password">
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={mode === "sign-up" ? 8 : undefined}
              autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
              placeholder="••••••••"
            />
          </Field>

          {error && (
            <p role="alert" className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" size="lg" disabled={pending} className="mt-1 w-full">
            {pending ? "…" : mode === "sign-in" ? "Sign in" : "Create account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ModeTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex-1 rounded-[6px] px-3 py-2 text-xs font-medium uppercase tracking-[0.05em] transition-colors duration-200 " +
        (active ? "bg-card text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)]" : "text-muted-foreground hover:text-foreground")
      }
    >
      {children}
    </button>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Signed-in — token + deploys                                        */
/* ------------------------------------------------------------------ */

function SignedIn({ user, deploys }: { user: SessionUser; deploys: DeploySummary[] }) {
  const [token, setToken] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function createToken() {
    setPending(true);
    try {
      const res = await fetch("/api/tokens", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "terminal " + new Date().toISOString() }),
      });
      const out = await res.json();
      setToken(out.token ? "export LUMINAWEB_TOKEN=" + out.token : JSON.stringify(out, null, 2));
    } finally {
      setPending(false);
    }
  }

  async function signOut() {
    await fetch("/api/auth/sign-out", { method: "POST" });
    window.location.href = "/account";
  }

  return (
    <Card>
      <CardHeader>
        <span className="tag tag--green" style={{ alignSelf: "flex-start", marginBottom: 4 }}>
          <span className="tag__dot" />signed in
        </span>
        <CardTitle>Connect your terminal.</CardTitle>
        <CardDescription>
          Using <strong className="text-foreground">{user.email}</strong>. Generate a token once,
          then paste it into your terminal.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Button onClick={createToken} disabled={pending} className="w-full">
            {pending ? "Creating…" : "Create CLI token"}
          </Button>
          {token && (
            <pre className="overflow-x-auto rounded-[8px] border border-border bg-muted px-4 py-3 font-mono text-xs leading-relaxed text-foreground">
              {token}
            </pre>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground">
            Your deploys
          </h3>
          {deploys.length ? (
            <ul className="flex flex-col divide-y divide-border border-y border-border">
              {deploys.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 py-3">
                  <a href={`/d/${d.id}`} className="font-medium text-foreground underline-offset-4 hover:underline">
                    {d.name}
                  </a>
                  <code className="font-mono text-xs text-muted-foreground">{d.id}</code>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No deploys claimed yet.</p>
          )}
        </div>

        <Button variant="outline" onClick={signOut} className="w-full">
          Sign out
        </Button>
      </CardContent>
    </Card>
  );
}
