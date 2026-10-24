import {
  api,
  RequestError,
  type User,
  type Workspace,
  type Member,
} from "./features/api.js";
import { signin, workspaceView, escape } from "./features/views.js";
const main = document.querySelector<HTMLElement>("#main")!,
  logout = document.querySelector<HTMLButtonElement>("#logout")!,
  notice = document.querySelector<HTMLElement>("#notice")!;
let user: User | null = null,
  workspaces: Workspace[] = [],
  selected: Workspace | null = null,
  members: Member[] = [];
let generation = 0,
  refreshSequence = 0,
  controller = new AbortController();
const channel =
  typeof BroadcastChannel === "function"
    ? new BroadcastChannel("budgeteer-context")
    : null;
let invitation = new URLSearchParams(location.hash.slice(1)).get("invite");
if (location.hash) history.replaceState(null, "", location.pathname);
function invalidate() {
  generation++;
  controller.abort();
  controller = new AbortController();
  user = null;
  workspaces = [];
  selected = null;
  members = [];
  logout.hidden = true;
  main.replaceChildren();
  notice.textContent = "";
}
function message(text: string) {
  notice.textContent = text;
}
function render() {
  logout.hidden = !user;
  main.innerHTML = user
    ? workspaceView(user, workspaces, selected, members, Boolean(invitation))
    : signin(Boolean(invitation));
}
async function refresh() {
  const current = generation,
    sequence = ++refreshSequence;
  controller.abort();
  controller = new AbortController();
  const signal = controller.signal;
  try {
    const session = await api<{ user: User }>(
      "/api/session",
      "GET",
      undefined,
      signal,
    );
    const result = await api<{ workspaces: Workspace[] }>(
      "/api/workspaces",
      "GET",
      undefined,
      signal,
    );
    if (current !== generation || sequence !== refreshSequence) return;
    const workspace =
      result.workspaces.find((item) => item.id === selected?.id) ||
      result.workspaces[0] ||
      null;
    const roster = workspace
      ? await api<{ members: Member[] }>(
          `/api/workspaces/${workspace.id}/members`,
          "GET",
          undefined,
          signal,
        )
      : { members: [] };
    if (current !== generation || sequence !== refreshSequence) return;
    const changed =
      user?.id !== session.user.id ||
      selected?.id !== workspace?.id ||
      JSON.stringify(workspaces) !== JSON.stringify(result.workspaces) ||
      JSON.stringify(members) !== JSON.stringify(roster.members);
    if (user?.id !== session.user.id || selected?.id !== workspace?.id)
      generation++;
    user = session.user;
    workspaces = result.workspaces;
    selected = workspace;
    members = roster.members;
    if (changed) render();
  } catch (error) {
    if (current !== generation || sequence !== refreshSequence) return;
    if (error instanceof RequestError && error.status === 401) {
      if (user) {
        invalidate();
        render();
      } else if (!document.querySelector("#signin")) render();
    } else if (!(
      error instanceof DOMException && error.name === "AbortError"
    )) {
      invalidate();
      main.innerHTML =
        '<section class="surface"><h1>No pudimos confirmar tu acceso</h1><p>Vuelve a conectarte e inténtalo otra vez.</p><button id="retry">Reintentar</button></section>';
    }
  }
}
main.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  const fields = new FormData(form);
  const context = generation;
  try {
    if (form.id === "signin") {
      await api("/api/auth/sign-in/email", "POST", Object.fromEntries(fields));
      if (context !== generation) return;
      channel?.postMessage("invalidate");
      await refresh();
    }
    if (form.id === "enroll") {
      const emailInput = document.querySelector<HTMLInputElement>("#email")!,
        passwordInput = document.querySelector<HTMLInputElement>("#password")!;
      if (!emailInput.reportValidity() || !passwordInput.reportValidity())
        return;
      const email = emailInput.value,
        password = passwordInput.value;
      await api("/api/enroll", "POST", {
        email,
        password,
        name: fields.get("name"),
        token: invitation,
      });
      if (context !== generation) return;
      invitation = null;
      await api("/api/auth/sign-in/email", "POST", { email, password });
      if (context !== generation) return;
      channel?.postMessage("invalidate");
      await refresh();
    }
    if (form.id === "create-workspace") {
      await api("/api/workspaces", "POST", { name: fields.get("name") });
      if (context !== generation) return;
      await refresh();
    }
  } catch {
    if (context === generation)
      message(
        "No se pudo completar la acción. Comprueba los datos y vuelve a intentarlo.",
      );
  }
});
main.addEventListener("change", (event) => {
  if ((event.target as HTMLElement).id === "workspace") {
    generation++;
    selected =
      workspaces.find(
        (item) => item.id === (event.target as HTMLSelectElement).value,
      ) || null;
    main.replaceChildren();
    void refresh();
  }
});
main.addEventListener("click", async (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
    "button",
  );
  if (!button) return;
  const context = generation,
    actorId = user?.id,
    workspaceId = selected?.id;
  const current = () =>
    context === generation &&
    actorId === user?.id &&
    workspaceId === selected?.id;
  try {
    if (button.id === "retry") {
      await refresh();
      return;
    }
    if (button.id === "accept") {
      await api("/api/invitations/accept", "POST", { token: invitation });
      if (!current()) return;
      invitation = null;
      await refresh();
    }
    if (button.id === "invite" && selected) {
      const grant = await api<{ token: string }>(
        `/api/workspaces/${selected.id}/invitations`,
        "POST",
        {},
      );
      if (!current()) return;
      const url =
        location.origin + "/#invite=" + encodeURIComponent(grant.token);
      document.querySelector("#grant")!.innerHTML =
        `<p>Comparte este enlace de un solo uso (vence en 24 horas):</p><p class="token">${escape(url)}</p>`;
    }
    if (button.dataset.remove && selected) {
      await api(
        `/api/workspaces/${selected.id}/members/${button.dataset.remove}`,
        "DELETE",
        {},
      );
      if (!current()) return;
      await refresh();
    }
  } catch {
    if (!current()) return;
    message("No se pudo completar la acción. Tu acceso puede haber cambiado.");
    await refresh();
  }
});
logout.addEventListener("click", async () => {
  try {
    await api("/api/auth/sign-out", "POST", {});
  } finally {
    invitation = null;
    invalidate();
    channel?.postMessage("invalidate");
    render();
  }
});
channel?.addEventListener("message", () => {
  invalidate();
  if (!document.hidden) void refresh();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) invalidate();
  else void refresh();
});
window.addEventListener("focus", () => {
  if (!document.hidden) void refresh();
});
window.addEventListener("pageshow", () => {
  invalidate();
  if (!document.hidden) void refresh();
});
setInterval(() => {
  if (!document.hidden) void refresh();
}, 30000);
void refresh();
