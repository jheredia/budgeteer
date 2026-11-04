import { chromium, type Page } from "playwright";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { createApp } from "../server/http/app.js";
await rm("verification/stage-1.json", { force: true });
const directory = await mkdtemp(path.join(tmpdir(), "budgeteer-browser-"));
const origin = "http://127.0.0.1:4174";
const config = {
  mode: "development-loopback" as const,
  origin,
  port: 4174,
  dataDirectory: directory,
  authSecret: randomBytes(32).toString("hex"),
};
const credentials = (email: string, name: string) => ({
  email,
  name,
  password: randomBytes(24).toString("base64url"),
});
const owner = credentials(
  "synthetic-owner@example.test",
  "Propietario sintético",
);
const member = credentials(
  "synthetic-member@example.test",
  "Miembro sintético",
);
const outsider = credentials(
  "synthetic-other@example.test",
  "Otra persona sintética",
);
let system = await createApp(config);
const workspace = await system.workspaces.bootstrap(
  owner,
  "Presupuesto compartido sintético",
);
await system.authentication.provisionAccount(outsider);
await system.app.listen({ host: "127.0.0.1", port: 4174 });
const browser = await chromium.launch({
  executablePath: process.env.BUDGETEER_CHROMIUM || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const ownerContext = await browser.newContext(),
  memberContext = await browser.newContext(),
  otherContext = await browser.newContext();
const ownerPage = await ownerContext.newPage(),
  memberPage = await memberContext.newPage(),
  otherPage = await otherContext.newPage();
const errors: string[] = [];
for (const page of [ownerPage, memberPage, otherPage])
  page.on("pageerror", (error) => errors.push(error.message));
async function login(page: Page, input: typeof owner) {
  await page.goto(origin);
  await page.getByRole("heading", { name: "Entra a Budgeteer" }).waitFor();
  await page.getByLabel("Identificador de inicio (correo)").fill(input.email);
  await page.getByLabel("Contraseña", { exact: true }).fill(input.password);
  await page
    .getByRole("button", { name: "Iniciar sesión", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Tu espacio compartido", exact: true })
    .waitFor();
}
try {
  await login(ownerPage, owner);
  await ownerPage
    .getByLabel("Nombre del espacio", { exact: true })
    .fill("Texto en curso");
  await ownerPage.evaluate(() => window.dispatchEvent(new Event("focus")));
  await ownerPage.waitForTimeout(150);
  assert.equal(
    await ownerPage
      .getByLabel("Nombre del espacio", { exact: true })
      .inputValue(),
    "Texto en curso",
  );
  await ownerPage.getByRole("button", { name: "Crear invitación" }).click();
  const link = await ownerPage.locator(".token").innerText();
  await memberPage.goto(link);
  await memberPage
    .getByRole("heading", { name: "Únete al espacio compartido" })
    .waitFor();
  await memberPage
    .getByLabel("Identificador de inicio (correo)")
    .fill(member.email);
  await memberPage
    .getByLabel("Contraseña", { exact: true })
    .fill(member.password);
  await memberPage.getByLabel("Nombre para mostrar").fill(member.name);
  await memberPage
    .getByRole("button", { name: "Crear cuenta con invitación" })
    .click();
  await memberPage
    .getByRole("heading", { name: "Tu espacio compartido", exact: true })
    .waitFor();
  assert.equal(
    await memberPage.locator("#workspace").inputValue(),
    workspace.id,
  );
  assert.match(
    await memberPage.locator("main").innerText(),
    /Propietario sintético/,
  );
  assert.equal(
    await memberPage.getByRole("button", { name: "Crear invitación" }).count(),
    0,
  );
  await ownerPage.reload();
  await ownerPage
    .getByText("Miembro sintético · Miembro", { exact: true })
    .waitFor();
  await mkdir("verification", { recursive: true });
  await ownerPage.screenshot({
    path: "verification/stage-1-owner.png",
    fullPage: true,
  });
  await memberPage.setViewportSize({ width: 390, height: 844 });
  await memberPage.screenshot({
    path: "verification/stage-1-member-mobile.png",
    fullPage: true,
  });
  let releaseInvite!: () => void;
  const held = new Promise<void>((resolve) => {
    releaseInvite = resolve;
  });
  let fetchedInvite!: () => void;
  const fetched = new Promise<void>((resolve) => {
    fetchedInvite = resolve;
  });
  await ownerPage.route("**/api/workspaces/*/invitations", async (route) => {
    const response = await route.fetch();
    fetchedInvite();
    await held;
    await route.fulfill({ response });
  });
  await ownerPage.getByRole("button", { name: "Crear invitación" }).click();
  await fetched;
  const secondOwnerTab = await ownerContext.newPage();
  await secondOwnerTab.goto(origin);
  await secondOwnerTab
    .getByRole("heading", { name: "Tu espacio compartido", exact: true })
    .waitFor();
  await secondOwnerTab.getByRole("button", { name: "Cerrar sesión" }).click();
  await ownerPage
    .getByRole("heading", { name: "Entra a Budgeteer", exact: true })
    .waitFor();
  releaseInvite();
  await ownerPage.waitForTimeout(150);
  assert.equal(
    await ownerPage.locator(".token").count(),
    0,
    "Late invitation response must not reveal an old-context grant",
  );
  await ownerPage.unroute("**/api/workspaces/*/invitations");
  await secondOwnerTab.close();
  await login(ownerPage, owner);
  await login(otherPage, outsider);
  const denied = await otherContext.request.get(
    origin + `/api/workspaces/${workspace.id}/members`,
  );
  assert.equal(denied.status(), 404);
  await system.app.close();
  system = await createApp(config);
  await system.app.listen({ host: "127.0.0.1", port: 4174 });
  await memberPage.reload();
  await memberPage
    .getByRole("heading", { name: "Tu espacio compartido", exact: true })
    .waitFor();
  assert.equal(
    await memberPage.locator("#workspace").inputValue(),
    workspace.id,
  );
  await ownerPage.reload();
  await ownerPage.getByRole("button", { name: "Quitar miembro" }).click();
  await memberPage.reload();
  await memberPage
    .getByRole("heading", { name: "Aún no perteneces a un espacio" })
    .waitFor();
  await ownerPage.getByRole("button", { name: "Cerrar sesión" }).click();
  await ownerPage.getByRole("heading", { name: "Entra a Budgeteer" }).waitFor();
  assert.equal(
    (await ownerContext.request.get(origin + "/api/session")).status(),
    401,
  );
  assert.deepEqual(errors, []);
  await writeFile(
    "verification/stage-1.json",
    JSON.stringify(
      {
        result: "passed",
        browser: "Chromium",
        checks: [
          "Invitation-only enrollment through browser",
          "Two independent accounts share persistent workspace",
          "Nonmember API denial",
          "Owner-only invitation/removal",
          "Application restart preserves membership and sessions",
          "Removed member denied",
          "Logout revokes server session",
          "Unchanged revalidation preserves active form",
          "Late invitation response discarded after cross-tab logout",
        ],
        errors,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    "Stage 1 real HTTP/browser proof passed. Credentials, cookies and invitation secrets were not logged.",
  );
} catch {
  console.error("STAGE_1_BROWSER_PROOF_FAILED");
  process.exitCode = 1;
} finally {
  await browser.close();
  await system.app.close();
  await rm(directory, { recursive: true, force: true });
}
