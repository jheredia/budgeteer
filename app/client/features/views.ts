import type { User, Workspace, Member } from "./api.js";
export const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  );
export function signin(invitation: boolean) {
  return `<section class="surface signin"><h1>${invitation ? "Únete al espacio compartido" : "Entra a Budgeteer"}</h1><p>Cada miembro usa su propia cuenta para compartir los mismos movimientos.</p><form id="signin"><label for="email">Identificador de inicio (correo)</label><input id="email" name="email" type="email" autocomplete="username" required><label for="password">Contraseña</label><input id="password" name="password" type="password" autocomplete="current-password" minlength="12" maxlength="128" required><div class="actions"><button type="submit">Iniciar sesión</button></div></form>${invitation ? '<form id="enroll"><h2>¿Primera vez aquí?</h2><label for="name">Nombre para mostrar</label><input id="name" name="name" maxlength="100" required><p class="muted">Usaremos el correo y la contraseña escritos arriba.</p><button type="submit">Crear cuenta con invitación</button></form>' : '<p class="muted">La primera cuenta se crea desde la configuración local. Las siguientes requieren una invitación.</p>'}</section>`;
}
export function workspaceView(
  user: User,
  workspaces: Workspace[],
  selected: Workspace | null,
  members: Member[],
  invitation: boolean,
) {
  const options = workspaces
    .map(
      (workspace) =>
        `<option value="${workspace.id}" ${selected?.id === workspace.id ? "selected" : ""}>${escape(workspace.name)}</option>`,
    )
    .join("");
  return `<h1>Tu espacio compartido</h1><p>Hola, ${escape(user.name)}. Cada persona entra con su propia cuenta.</p><p class="mode">Aplicación en desarrollo · Formatos de proveedores pendientes.</p>${invitation ? '<section class="surface"><h2>Invitación pendiente</h2><button id="accept">Aceptar invitación</button></section>' : ""}${workspaces.length ? `<section class="surface"><label for="workspace">Espacio</label><select id="workspace">${options}</select><p class="muted">${selected?.role === "owner" ? "Eres propietario de este espacio." : "Eres miembro de este espacio."}</p></section>` : '<section class="surface"><h2>Aún no perteneces a un espacio</h2><p>Pide una invitación o crea tu propio espacio.</p></section>'}${selected ? memberView(selected, members) : ""}<section class="surface"><h2>Crear otro espacio</h2><form id="create-workspace"><label for="workspace-name">Nombre del espacio</label><input id="workspace-name" name="name" maxlength="100" required><div class="actions"><button>Crear espacio</button></div></form></section>`;
}
function memberView(workspace: Workspace, members: Member[]) {
  return `<section class="surface"><h2>Miembros</h2>${members.map((member) => `<div class="member"><span>${escape(member.name)} · ${member.role === "owner" ? "Propietario" : "Miembro"}</span>${workspace.role === "owner" && member.role !== "owner" ? `<button class="secondary" data-remove="${member.userId}">Quitar miembro</button>` : ""}</div>`).join("")}${workspace.role === "owner" ? '<div class="actions"><button id="invite">Crear invitación</button></div><div id="grant"></div>' : ""}</section><section class="surface"><h2>Movimientos</h2><p>El espacio empieza vacío. Los datos de ejemplo no se mezclan con tus datos.</p><p class="muted">La revisión y el libro persistente se conectarán en el siguiente tramo. No hay buzones conectados ni formatos bancarios verificados.</p></section>`;
}
