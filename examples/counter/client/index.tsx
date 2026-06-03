import { render } from "@zapdev/runtime/client";
import { useMutation, useQuery } from "@zapdev/runtime/client";
import type { CounterState } from "../shared/counter.js";

export function App() {
  const state = useQuery<CounterState>("count");
  const increment = useMutation<[by?: number], void>("increment");
  const decrement = useMutation<[by?: number], void>("decrement");
  const reset = useMutation<[], void>("reset");

  const value = state?.value ?? 0;

  return (
    <main class="min-h-[100dvh] bg-[#0a0a0a] px-6 py-16 font-sans text-[#f5f5f0]">
      <section class="mx-auto flex w-full max-w-xl flex-col items-center text-center">
        <p class="font-mono text-xs uppercase tracking-[0.2em] text-[#7a7a75]">
          a zapdev capsule
        </p>
        <h1 class="mt-2 font-mono text-2xl font-medium tracking-tight">
          <span class="text-[#D4FF4F]">▌</span> counter
        </h1>

        <div class="my-16 font-mono text-[140px] font-light leading-none tracking-[-0.04em] text-[#f5f5f0]">
          {value}
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            class="rounded-full border border-[#1f1f1d] px-5 py-3 font-mono text-sm text-[#f5f5f0] transition-[border-color] duration-200 ease-out hover:border-[#D4FF4F] active:scale-[0.98]"
            onClick={() => void decrement(1)}
          >
            -1
          </button>
          <button
            type="button"
            class="rounded-full border border-[#1f1f1d] px-5 py-3 font-mono text-sm text-[#f5f5f0] transition-[border-color] duration-200 ease-out hover:border-[#D4FF4F] active:scale-[0.98]"
            onClick={() => void decrement(10)}
          >
            -10
          </button>
          <button
            type="button"
            class="rounded-full bg-[#D4FF4F] px-6 py-3 font-mono text-sm font-medium text-[#0a0a0a] transition-[transform] duration-200 ease-out active:scale-[0.98]"
            onClick={() => void increment(1)}
          >
            +1
          </button>
          <button
            type="button"
            class="rounded-full border border-[#1f1f1d] px-5 py-3 font-mono text-sm text-[#f5f5f0] transition-[border-color] duration-200 ease-out hover:border-[#D4FF4F] active:scale-[0.98]"
            onClick={() => void increment(10)}
          >
            +10
          </button>
        </div>

        <button
          type="button"
          class="mt-8 font-mono text-[10px] uppercase tracking-[0.2em] text-[#3a3a38] transition-[color] duration-200 ease-out hover:text-[#7a7a75]"
          onClick={() => void reset()}
        >
          reset
        </button>

        <footer class="mt-20 font-mono text-[10px] uppercase tracking-[0.2em] text-[#3a3a38]">
          shared across all visitors
        </footer>
      </section>
    </main>
  );
}

const root = document.getElementById("app");
if (root) render(<App />, root);
