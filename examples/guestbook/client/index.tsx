import { render } from "luminaweb-runtime/client";
import { useAuth, useMutation, useQuery, SignInWithGoogle, signOut } from "luminaweb-runtime/client";
import type { Entry } from "../shared/guestbook.js";
import { cleanEntry } from "../shared/guestbook.js";

export function App() {
  const auth = useAuth();
  const entries = useQuery<Entry[]>("entries");
  const sign = useMutation<[body: string], void>("sign");

  async function onSubmit(event: SubmitEvent) {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const body = cleanEntry(String(data.get("body") ?? ""));
    if (!body) return;
    await sign(body);
    form.reset();
  }

  return (
    <main class="min-h-[100dvh] bg-[#0a0a0a] px-6 py-12 font-sans text-[#f5f5f0]">
      <section class="mx-auto w-full max-w-2xl">
        <header class="mb-10 flex items-center justify-between">
          <div>
            <h1 class="font-mono text-2xl font-medium tracking-tight">
              <span class="text-[#D4FF4F]">▌</span> guestbook
            </h1>
            <p class="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-[#7a7a75]">
              leave a mark · read the wall
            </p>
          </div>
          <div class="font-mono text-xs">
            {auth.isLoading ? (
              <span class="text-[#7a7a75]">checking…</span>
            ) : auth.isGuest ? (
              <SignInWithGoogle />
            ) : (
              <button
                type="button"
                class="rounded-full border border-[#1f1f1d] px-3 py-1.5 transition-[border-color] duration-200 ease-out hover:border-[#D4FF4F]"
                onClick={() => void signOut()}
              >
                sign out
              </button>
            )}
          </div>
        </header>

        <form
          class="mb-12 space-y-3"
          onSubmit={(event) => void onSubmit(event)}
        >
          <textarea
            name="body"
            rows={3}
            placeholder="say something kind"
            class="w-full resize-none border border-[#1f1f1d] bg-[#0a0a0a] px-4 py-3 font-mono text-sm text-[#f5f5f0] outline-none transition-[border-color] duration-200 ease-out placeholder:text-[#3a3a38] focus:border-[#D4FF4F]"
            required
          />
          <div class="flex justify-end">
            <button
              type="submit"
              class="rounded-full bg-[#D4FF4F] px-5 py-3 font-mono text-sm font-medium text-[#0a0a0a] transition-[transform] duration-200 ease-out active:scale-[0.98]"
            >
              sign
            </button>
          </div>
        </form>

        <ul class="space-y-8">
          {(entries ?? []).map((entry) => (
            <li key={entry.id} class="flex gap-4">
              <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-[#1f1f1d] bg-[#131313] font-mono text-sm text-[#D4FF4F]">
                {entry.authorPicture ? (
                  <img
                    src={entry.authorPicture}
                    alt=""
                    class="h-full w-full rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  entry.authorName[0]?.toUpperCase()
                )}
              </div>
              <div class="min-w-0 flex-1">
                <div class="mb-1 flex items-baseline gap-2">
                  <span class="font-mono text-sm text-[#f5f5f0]">
                    {entry.authorName}
                  </span>
                  <span class="font-mono text-[10px] uppercase tracking-[0.2em] text-[#3a3a38]">
                    {new Date(entry.createdAt).toLocaleString()}
                  </span>
                </div>
                <p class="font-mono text-sm leading-relaxed text-[#b7b7b3]">
                  {entry.body}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {(entries?.length ?? 0) === 0 && (
          <div class="mt-16 text-center font-mono text-xs uppercase tracking-[0.2em] text-[#3a3a38]">
            no entries yet · be the first
          </div>
        )}
      </section>
    </main>
  );
}

const root = document.getElementById("app");
if (root) render(<App />, root);
