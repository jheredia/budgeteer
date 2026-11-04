import { chromium, type Page } from "playwright";
import assert from "node:assert/strict";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { createApp } from "../server/http/app.js";
import { syntheticMime } from "../server/imports/synthetic.js";
const directory = await mkdtemp(
    path.join(tmpdir(), "budgeteer-financial-browser-"),
  ),
  origin = "http://127.0.0.1:4174";
const config = {
  mode: "development-loopback" as const,
  origin,
  port: 4174,
  dataDirectory: directory,
  authSecret: randomBytes(32).toString("hex"),
};
const credentials = (role: string) => ({
  email: `synthetic-${role}@example.test`,
  name: `Persona sintética ${role}`,
  password: randomBytes(24).toString("base64url"),
});
const owner = credentials("owner"),
  member = credentials("member");
let system = await createApp(config);
const workspace = await system.workspaces.bootstrap(
  owner,
  "Libro compartido sintético",
);
// Only synthetic account enrollment. Real invitation UI remains covered by stage 1.
const tempCookie = await system.app.inject({
  method: "POST",
  url: "/api/auth/sign-in/email",
  headers: {
    host: "127.0.0.1:4174",
    origin,
    "content-type": "application/json",
  },
  payload: owner,
});
const cookie = tempCookie.cookies.map((c) => `${c.name}=${c.value}`).join("; ");
const ownerId = (
  await system.app.inject({
    url: "/api/session",
    headers: { host: "127.0.0.1:4174", cookie },
  })
).json().user.id;
await system.workspaces.enroll(
  system.workspaces.invite(ownerId, workspace.id).token,
  member,
);
await system.app.listen({ host: "127.0.0.1", port: 4174 });
const browser = await chromium.launch({
  executablePath: process.env.BUDGETEER_CHROMIUM || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const browserLocale = { locale: "es-CL", timezoneId: "America/Santiago" };
const ownerContext = await browser.newContext(browserLocale),
  memberContext = await browser.newContext(browserLocale);
const page = await ownerContext.newPage(),
  peer = await memberContext.newPage();
const errors: string[] = [];
for (const p of [page, peer]) p.on("pageerror", (e) => errors.push(e.message));
let releaseHeld = () => {};
let releaseDetail = () => {};
let step = "login";
async function login(p: Page, input: typeof owner) {
  await p.goto(origin);
  await p.getByLabel("Identificador de inicio (correo)").fill(input.email);
  await p.getByLabel("Contraseña", { exact: true }).fill(input.password);
  await p.getByRole("button", { name: "Iniciar sesión", exact: true }).click();
  await p
    .getByRole("heading", { name: "Importar para revisión", exact: true })
    .waitFor();
}
try {
  await rm("verification/financial-stage.json", { force: true });
  await login(page, owner);
  await login(peer, member);
  assert.match(await page.locator("#ledger-list").innerText(), /Aún no hay/);
  await page.getByRole("button", { name: "Probar ejemplo sintético" }).click();
  await page
    .getByRole("heading", { name: "Propuesta editable", exact: true })
    .waitFor();
  await page.getByLabel("Monto CLP", { exact: true }).fill("15900");
  await page
    .getByLabel("Descripción", { exact: true })
    .fill("Compra corregida sintética");
  await page.getByLabel("Categoría (opcional)").fill("Hogar");
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await page.waitForTimeout(100);
  assert.equal(
    await page.getByLabel("Monto CLP", { exact: true }).inputValue(),
    "15900",
  );
  await mkdir("verification", { recursive: true });
  await page.locator("#financial-detail").screenshot({
    path: "verification/financial-review-desktop.png",
  });
  step = "approve corrected";
  await page
    .getByRole("button", { name: "Aprobar movimiento", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Campos aprobados", exact: true })
    .waitFor();
  assert.match(await page.locator(".evidence").innerText(), /12\.500/);
  assert.match(await page.locator("#financial-detail").innerText(), /15\.900/);
  await peer.reload();
  await peer.getByText("Compra corregida sintética", { exact: true }).waitFor();
  step = "credit example";
  await page
    .getByLabel("Formato de notificación", { exact: true })
    .selectOption("santander_credit_v1");
  await page.getByRole("button", { name: "Probar ejemplo sintético" }).click();
  await page
    .getByRole("heading", { name: "Propuesta editable", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Ignorar y eliminar propuesta" })
    .click();
  await page
    .getByText("Propuesta, evidencia y marca de repetición eliminadas.", {
      exact: true,
    })
    .waitFor();
  await page.getByRole("button", { name: "Probar ejemplo sintético" }).click();
  await page
    .getByRole("heading", { name: "Propuesta editable", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Aprobar movimiento", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Campos aprobados", exact: true })
    .waitFor();
  await page
    .getByLabel("Tipo", { exact: true })
    .selectOption("credit_card_purchase");
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await page.waitForFunction(() =>
    document
      .querySelector("#ledger-totals")
      ?.textContent?.includes("1 movimientos"),
  );
  assert.match(await page.locator("#ledger-totals").innerText(), /12\.500/);
  assert.doesNotMatch(
    await page.locator("#ledger-list").innerText(),
    /Compra corregida/,
  );
  await page.getByRole("button", { name: "Limpiar filtros" }).click();
  // Actual file selection uploads an in-memory invented MIME; no email fixture is written.
  await page
    .getByLabel("Formato de notificación", { exact: true })
    .selectOption("santander_sent_transfer_v1");
  await page.locator("#synthetic-file").setInputFiles({
    name: "invented-message",
    mimeType: "application/octet-stream",
    buffer: Buffer.from(syntheticMime("santander_sent_transfer_v1")),
  });
  await page.locator("#synthetic-confirm").check();
  await page
    .getByRole("button", { name: "Importar archivo sintético", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Propuesta editable", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Cerrar detalle", exact: true })
    .click();
  await page
    .getByLabel("Formato de notificación", { exact: true })
    .selectOption("santander_debit_v1");
  await page.getByRole("button", { name: "Probar ejemplo sintético" }).click();
  await page
    .getByRole("heading", { name: "Propuesta editable", exact: true })
    .waitFor();
  let fetched = () => {};
  const fetchedPromise = new Promise<void>((r) => (fetched = r));
  const held = new Promise<void>((r) => (releaseHeld = r));
  await page.route("**/proposals/*/approve", async (route) => {
    const response = await route.fetch();
    fetched();
    await held;
    await route.fulfill({ response });
  });
  await page
    .getByRole("button", { name: "Aprobar movimiento", exact: true })
    .click();
  await fetchedPromise;
  const transferRow = page
    .locator("#pending-list .financial-row")
    .filter({ hasText: "Transferencia bancaria" });
  await transferRow
    .getByRole("button", { name: "Revisar", exact: true })
    .click();
  await page
    .getByLabel("Descripción", { exact: true })
    .fill("Borrador no debe reiniciarse");
  releaseHeld();
  await page.waitForTimeout(100);
  assert.equal(
    await page.getByLabel("Descripción", { exact: true }).inputValue(),
    "Borrador no debe reiniciarse",
  );
  await page.unroute("**/proposals/*/approve");
  await system.app.close();
  system = await createApp(config);
  await system.app.listen({ host: "127.0.0.1", port: 4174 });
  await peer.reload();
  await peer.getByText("Compra corregida sintética", { exact: true }).waitFor();
  await peer.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await peer.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await mkdir("verification", { recursive: true });
  await peer.screenshot({
    path: "verification/financial-member-mobile.png",
    fullPage: true,
  });
  // Delay an actual financial detail response across cross-tab logout.
  const sibling = await ownerContext.newPage();
  await sibling.goto(origin);
  await sibling
    .getByRole("heading", { name: "Importar para revisión", exact: true })
    .waitFor();
  let fetchedDetail = () => {};
  const detailFetched = new Promise<void>((r) => (fetchedDetail = r)),
    detailHeld = new Promise<void>((r) => (releaseDetail = r));
  await page.route("**/ledger/*", async (route) => {
    const response = await route.fetch();
    fetchedDetail();
    await detailHeld;
    await route.fulfill({ response });
  });
  await page.bringToFront();
  await page.reload();
  await page
    .locator("#ledger-list")
    .getByRole("button", { name: "Ver detalle", exact: true })
    .first()
    .click();
  await detailFetched;
  let fetchedLogout = () => {};
  const logoutFetched = new Promise<void>((r) => (fetchedLogout = r)),
    logoutHeld = new Promise<void>((r) => (releaseHeld = r));
  await sibling.route("**/api/auth/sign-out", async (route) => {
    fetchedLogout();
    await logoutHeld;
    await route.abort();
  });
  await sibling.bringToFront();
  await sibling
    .getByRole("button", { name: "Cerrar sesión", exact: true })
    .click();
  await logoutFetched;
  await page
    .getByRole("heading", { name: "Entra a Budgeteer", exact: true })
    .waitFor();
  assert.equal(await sibling.locator("#financial").count(), 0);
  assert.equal(await page.locator("#financial").count(), 0);
  await page.evaluate(() => {
    window.dispatchEvent(new Event("focus"));
    window.dispatchEvent(new Event("pageshow"));
  });
  await page.waitForTimeout(100);
  assert.equal(await page.locator("#financial").count(), 0);
  // Releasing signout cannot restore old data. Closing the page drops its held financial response.
  releaseDetail();
  await page.waitForTimeout(100);
  assert.equal(await page.locator("#financial").count(), 0);
  releaseHeld();
  await sibling
    .getByRole("heading", { name: "Entra a Budgeteer", exact: true })
    .waitFor();
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await page.waitForTimeout(100);
  assert.equal(await page.locator("#financial").count(), 0);
  await sibling.close();
  assert.deepEqual(errors, []);
  await writeFile(
    "verification/financial-stage.json",
    JSON.stringify(
      {
        result: "passed",
        browser: "Chromium",
        locale: browserLocale.locale,
        browserTimezone: browserLocale.timezoneId,
        scope: "synthetic local verification only",
        checks: [
          "Two independent accounts read persistent reviewed ledger after restart",
          "In-memory synthetic MIME upload and built-in example",
          "Correction preserves immutable evidence",
          "Ignore allows fresh reimport",
          "Filter buckets and totals",
          "Polling preserves active review form",
          "Late approval A preserves selected proposal B draft",
          "Mobile fits viewport",
          "Immediate cross-tab logout conceals financial content during delayed signout",
          "Focus/pageshow cannot restore local logout intent",
          "No page errors",
        ],
      },
      null,
      2,
    ) + "\n",
  );
  console.log("Synthetic financial Chromium journey passed.");
} catch (error) {
  console.error(
    "FINANCIAL_BROWSER_PROOF_FAILED",
    step,
    error instanceof Error ? error.message : "unknown",
    await page
      .locator("#financial-status")
      .textContent()
      .catch(() => "no status"),
  );
  process.exitCode = 1;
} finally {
  releaseHeld();
  releaseDetail();
  await browser.close();
  await system.app.close();
  await rm(directory, { recursive: true, force: true });
}
