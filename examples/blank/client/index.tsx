import { render } from "@zapdev/runtime/client";
import { useQuery } from "@zapdev/runtime/client";
import type { Greeting } from "../shared/blank.js";

export function App() {
  const greeting = useQuery<Greeting>("hello");

  return (
    <main class="min-h-[100dvh] bg-[#0a0a0a] px-6 py-16 font-sans text-[#f5f5f0]">
      <section class="mx-auto w-full max-w-xl">
        <h1 class="font-mono text-2xl font-medium tracking-tight">
          <span class="text-[#D4FF4F]">▌</span> blank
        </h1>
        <p class="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-[#7a7a75]">
          a zapdev capsule
        </p>

        <div class="mt-16 border border-[#1f1f1d] bg-[#0d0d0d] p-6 font-mono text-sm">
          <div class="text-[10px] uppercase tracking-[0.2em] text-[#7a7a75]">
            /__zap__/query/hello
          </div>
          <pre class="mt-3 text-[#f5f5f0]">
            {JSON.stringify(greeting ?? { message: "loading…", at: "—" }, null, 2)}
          </pre>
        </div>

        <footer class="mt-12 font-mono text-[10px] uppercase tracking-[0.2em] text-[#3a3a38]">
          edit <code class="text-[#7a7a75]">server/index.ts</code> and{" "}
          <code class="text-[#7a7a75]">client/index.tsx</code>
        </footer>
      </section>
    </main>
  );
}

const root = document.getElementById("app");
if (root) render(<App />, root);
