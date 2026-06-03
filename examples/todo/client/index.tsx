import { render } from "@zapdev/runtime/client";
import { useAuth, useMutation, useQuery, SignInWithGoogle, signOut } from "@zapdev/runtime/client";
import type { Todo } from "../shared/todo.js";
import { cleanTodoText } from "../shared/todo.js";

export function App() {
  const auth = useAuth();
  const todos = useQuery<Todo[]>("todos");
  const addTodo = useMutation<[text: string], void>("addTodo");
  const setTodoDone = useMutation<[id: string, done: boolean], void>("setTodoDone");
  const clearDone = useMutation<[], void>("clearDone");

  async function onSubmit(event: SubmitEvent) {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const text = cleanTodoText(String(data.get("text") ?? ""));
    if (!text) return;
    await addTodo(text);
    form.reset();
  }

  const remaining = (todos ?? []).filter((t) => !t.done).length;
  const done = (todos ?? []).filter((t) => t.done).length;

  return (
    <main class="min-h-[100dvh] bg-[#0a0a0a] px-6 py-12 font-sans text-[#f5f5f0]">
      <section class="mx-auto w-full max-w-2xl">
        <header class="mb-10 flex items-center justify-between">
          <div>
            <h1 class="font-mono text-2xl font-medium tracking-tight">
              <span class="text-[#D4FF4F]">▌</span> todos
            </h1>
            <p class="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-[#7a7a75]">
              a zapdev capsule
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
                sign out {auth.displayName}
              </button>
            )}
          </div>
        </header>

        <form
          class="mb-8 flex gap-2"
          onSubmit={(event) => void onSubmit(event)}
        >
          <input
            name="text"
            placeholder="ship the thing"
            class="min-w-0 flex-1 border border-[#1f1f1d] bg-[#0a0a0a] px-4 py-3 font-mono text-sm text-[#f5f5f0] outline-none transition-[border-color] duration-200 ease-out placeholder:text-[#3a3a38] focus:border-[#D4FF4F]"
            required
          />
          <button
            type="submit"
            class="rounded-full bg-[#D4FF4F] px-5 py-3 font-mono text-sm font-medium text-[#0a0a0a] transition-[transform] duration-200 ease-out active:scale-[0.98]"
          >
            add
          </button>
        </form>

        {(todos?.length ?? 0) > 0 && (
          <div class="mb-4 flex items-center justify-between font-mono text-xs text-[#7a7a75]">
            <span>
              {remaining} remaining · {done} done
            </span>
            {done > 0 && (
              <button
                type="button"
                class="rounded-full border border-[#1f1f1d] px-3 py-1.5 transition-[border-color] duration-200 ease-out hover:border-[#D4FF4F]"
                onClick={() => void clearDone()}
              >
                clear done
              </button>
            )}
          </div>
        )}

        <ul class="divide-y divide-[#1f1f1d] border-y border-[#1f1f1d]">
          {(todos ?? []).map((todo) => (
            <li key={todo.id} class="group flex items-center gap-3 py-3">
              <label class="flex flex-1 cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={todo.done}
                  onChange={(event) =>
                    void setTodoDone(todo.id, event.currentTarget.checked)
                  }
                  class="h-4 w-4 cursor-pointer appearance-none rounded-[4px] border border-[#3a3a38] bg-transparent transition-[border-color,background-color] duration-200 ease-out checked:border-[#D4FF4F] checked:bg-[#D4FF4F]"
                />
                <span
                  class={`flex-1 font-mono text-sm ${
                    todo.done ? "text-[#3a3a38] line-through" : "text-[#f5f5f0]"
                  }`}
                >
                  {todo.text}
                </span>
              </label>
              <span class="font-mono text-[10px] uppercase tracking-[0.2em] text-[#3a3a38] group-hover:text-[#7a7a75]">
                {todo.id.slice(0, 6)}
              </span>
            </li>
          ))}
        </ul>

        {(todos?.length ?? 0) === 0 && (
          <div class="mt-16 text-center font-mono text-xs uppercase tracking-[0.2em] text-[#3a3a38]">
            nothing to do · ship the thing
          </div>
        )}

        <footer class="mt-12 font-mono text-[10px] uppercase tracking-[0.2em] text-[#3a3a38]">
          open <code class="text-[#7a7a75]">?zapdev_guest=alice</code> in another tab to test multi-user
        </footer>
      </section>
    </main>
  );
}

const root = document.getElementById("app");
if (root) render(<App />, root);
