import { render } from "@zapdev/runtime/client";
import { useAuth, useMutation, useQuery, SignInWithGoogle, signOut } from "@zapdev/runtime/client";
import type { Message } from "../shared/chat.js";
import { cleanMessage } from "../shared/chat.js";

export function App() {
  const auth = useAuth();
  const messages = useQuery<Message[]>("messages");
  const send = useMutation<[body: string], void>("send");
  const deleteOwn = useMutation<[id: string], void>("deleteOwn");

  async function onSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (auth.isGuest) return;
    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const body = cleanMessage(String(data.get("body") ?? ""));
    if (!body) return;
    await send(body);
    form.reset();
  }

  return (
    <main class="min-h-[100dvh] bg-[#0a0a0a] px-6 py-12 font-sans text-[#f5f5f0]">
      <section class="mx-auto flex h-[calc(100dvh-6rem)] w-full max-w-2xl flex-col">
        <header class="mb-6 flex items-center justify-between">
          <div>
            <h1 class="font-mono text-2xl font-medium tracking-tight">
              <span class="text-[#D4FF4F]">▌</span> chat
            </h1>
            <p class="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-[#7a7a75]">
              one room · everyone invited
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

        <ul class="flex-1 space-y-6 overflow-y-auto pb-4">
          {(messages ?? []).map((msg) => {
            const mine = msg.authorId === auth.userId;
            return (
              <li key={msg.id} class="flex gap-3">
                <div class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-[#1f1f1d] bg-[#131313] font-mono text-xs text-[#D4FF4F]">
                  {msg.authorPicture ? (
                    <img
                      src={msg.authorPicture}
                      alt=""
                      class="h-full w-full rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    msg.authorName[0]?.toUpperCase() ?? "?"
                  )}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="mb-1 flex items-baseline gap-2">
                    <span class={`font-mono text-xs ${mine ? "text-[#D4FF4F]" : "text-[#f5f5f0]"}`}>
                      {msg.authorName}
                    </span>
                    <span class="font-mono text-[10px] uppercase tracking-[0.2em] text-[#3a3a38]">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p class="font-mono text-sm leading-relaxed text-[#b7b7b3] break-words">
                    {msg.body}
                  </p>
                </div>
                {mine && (
                  <button
                    type="button"
                    class="self-start font-mono text-[10px] uppercase tracking-[0.2em] text-[#3a3a38] transition-[color] duration-200 ease-out hover:text-[#7a7a75]"
                    onClick={() => void deleteOwn(msg.id)}
                  >
                    delete
                  </button>
                )}
              </li>
            );
          })}
          {(messages?.length ?? 0) === 0 && (
            <li class="text-center font-mono text-xs uppercase tracking-[0.2em] text-[#3a3a38]">
              no messages yet · say hi
            </li>
          )}
        </ul>

        <form
          class="mt-4 flex gap-2 border-t border-[#1f1f1d] pt-4"
          onSubmit={(event) => void onSubmit(event)}
        >
          <input
            name="body"
            placeholder={auth.isGuest ? "sign in to send a message" : "say something"}
            disabled={auth.isGuest}
            class="min-w-0 flex-1 border border-[#1f1f1d] bg-[#0a0a0a] px-4 py-3 font-mono text-sm text-[#f5f5f0] outline-none transition-[border-color,opacity] duration-200 ease-out placeholder:text-[#3a3a38] focus:border-[#D4FF4F] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={auth.isGuest}
            class="rounded-full bg-[#D4FF4F] px-5 py-3 font-mono text-sm font-medium text-[#0a0a0a] transition-[transform,opacity] duration-200 ease-out active:scale-[0.98] disabled:opacity-50"
          >
            send
          </button>
        </form>
      </section>
    </main>
  );
}

const root = document.getElementById("app");
if (root) render(<App />, root);
