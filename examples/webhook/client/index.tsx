import { render } from "luminaweb-runtime/client";
import { useQuery } from "luminaweb-runtime/client";
import type { Hit } from "../shared/webhook.js";

export function App() {
  const hits = useQuery<Hit[]>("hits");

  return (
    <main class="min-h-[100dvh] bg-[#0a0a0a] px-6 py-12 font-sans text-[#f5f5f0]">
      <section class="mx-auto w-full max-w-3xl">
        <header class="mb-10">
          <h1 class="font-mono text-2xl font-medium tracking-tight">
            <span class="text-[#D4FF4F]">▌</span> webhook inspector
          </h1>
          <p class="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-[#7a7a75]">
            POST to <code class="text-[#f5f5f0]">/hooks/inbound</code> with header{" "}
            <code class="text-[#f5f5f0]">x-webhook-secret</code>
          </p>
        </header>

        <ul class="space-y-3">
          {(hits ?? []).map((hit) => (
            <li
              key={hit.id}
              class="border border-[#1f1f1d] bg-[#0d0d0d] p-4 font-mono text-sm"
            >
              <div class="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-[#7a7a75]">
                <span>{hit.source}</span>
                <span>{new Date(hit.receivedAt).toLocaleString()}</span>
              </div>
              <pre class="overflow-x-auto whitespace-pre text-[#b7b7b3]">
                {JSON.stringify(hit.body, null, 2)}
              </pre>
            </li>
          ))}
        </ul>

        {(hits?.length ?? 0) === 0 && (
          <div class="mt-16 text-center font-mono text-xs uppercase tracking-[0.2em] text-[#3a3a38]">
            no hits yet · send one with curl
          </div>
        )}

        <footer class="mt-12 font-mono text-[10px] uppercase tracking-[0.2em] text-[#3a3a38]">
          <code class="text-[#7a7a75]">refresh tab</code> to refetch
        </footer>
      </section>
    </main>
  );
}

const root = document.getElementById("app");
if (root) render(<App />, root);
