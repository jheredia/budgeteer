import { api, RequestError } from "./api.js";
import { escape } from "./views.js";
interface Fields {
  label: string;
  amount: number;
  occurredAt: string;
  category: string;
  type: string;
  direction: string;
}
interface Evidence {
  contract: string;
  provider: string;
  observations: {
    amount: number;
    date: string;
    localTime?: string | null;
    merchant?: string;
    instrument?: { kind: string; maskedLast4: string };
    timezone: string;
    currency: string;
  };
}
interface Proposal {
  id: string;
  fields: Fields;
  version: number;
  expiresAt: number;
  evidence: Evidence;
}
interface Entry extends Fields {
  id: string;
  provider: string;
  evidence: Evidence;
}
const contracts = [
  ["banco_chile_debit_v1", "Banco de Chile · cargo en cuenta"],
  ["banco_chile_credit_v1", "Banco de Chile · compra crédito"],
  ["santander_debit_v1", "Santander · compra débito"],
  ["santander_credit_v1", "Santander · compra crédito"],
  ["santander_sent_transfer_v1", "Santander · transferencia enviada"],
];
const types = [
  ["debit", "Débito"],
  ["received_payment", "Pago recibido"],
  ["credit_card_purchase", "Compra con crédito"],
  ["bank_transfer", "Transferencia bancaria"],
];
const directions = [
  ["incoming", "Entrada"],
  ["outgoing", "Salida"],
  ["unresolved", "Sin resolver"],
];
const options = (values: string[][], selected = "") =>
  values
    .map(
      ([value, label]) =>
        `<option value="${value}" ${value === selected ? "selected" : ""}>${label}</option>`,
    )
    .join("");
const money = (value: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
const labelFor = (values: string[][], value: string) =>
  values.find((v) => v[0] === value)?.[1] ?? value;
export function financialShell() {
  return `<section class="surface"><h2>Importar para revisión</h2><p class="mode">Solo verificación local con datos sintéticos. No subas correos ni datos financieros reales. El uso compartido con datos reales sigue cerrado.</p><form id="import-financial"><label for="contract">Formato de notificación</label><select id="contract" name="contract">${options(contracts)}</select><p class="muted">Seleccionar un formato no verifica que el banco haya enviado el mensaje.</p><label for="synthetic-file">Un archivo de notificación sintética (máximo 1 MiB)</label><input id="synthetic-file" name="file" type="file"><label class="check"><input id="synthetic-confirm" type="checkbox" required> Confirmo que el archivo contiene únicamente datos inventados</label><div class="actions"><button type="submit">Importar archivo sintético</button><button type="button" id="synthetic-example" class="secondary">Probar ejemplo sintético</button></div></form><p id="financial-status" role="status" aria-live="polite"></p></section><section class="surface"><h2>Pendientes de revisión</h2><p class="muted">Nada se agrega al libro hasta que lo apruebes. Las propuestas vencen a los 30 días.</p><div id="pending-list"></div></section><section id="financial-detail" class="surface" hidden aria-live="polite"></section><section class="surface"><h2>Libro de movimientos</h2><form id="ledger-filter" class="filters"><div><label for="filter-month">Mes</label><input id="filter-month" name="month" type="month"></div><div><label for="filter-provider">Proveedor declarado</label><select id="filter-provider" name="provider"><option value="">Todos</option><option value="banco_chile">Banco de Chile</option><option value="santander">Santander</option></select></div><div><label for="filter-type">Tipo</label><select id="filter-type" name="type"><option value="">Todos</option>${options(types)}</select></div><div><label for="filter-direction">Dirección</label><select id="filter-direction" name="direction"><option value="">Todas</option>${options(directions)}</select></div><div class="actions"><button>Aplicar filtros</button><button id="clear-filters" type="button" class="secondary">Limpiar filtros</button></div></form><div id="ledger-totals"></div><p class="muted">Entradas y salidas confirmadas excluyen compras con crédito. Las compras con crédito confirmadas excluyen dirección sin resolver; los sin resolver aparecen aparte. Las transferencias no se clasifican como gastos, ni las entradas como ingresos. No representa un saldo.</p><div id="ledger-list"></div></section><section class="surface"><h2>Fuentes y privacidad</h2><p>No hay buzones conectados. Solo se cubren los cinco formatos declarados arriba: cuatro compras y una transferencia enviada. Pagos en línea, transferencias recibidas, Banco Estado y MercadoPago siguen pendientes.</p><p>Solo guardamos evidencia estructurada mínima y campos revisados; nunca el MIME, el cuerpo, los encabezados o el nombre del archivo. La evidencia no cambia al corregir la propuesta.</p><p>Reimportar los mismos bytes en este espacio abre el resultado retenido. Esto no detecta duplicados semánticos. Ignorar o vencer una propuesta elimina su evidencia y marca de repetición; podrás volver a importarla. Los aprobados permanecen durante la vida del espacio. La eliminación completa del espacio y el endurecimiento de autenticación siguen pendientes.</p></section>`;
}
function evidenceView(e: Evidence) {
  const o = e.observations;
  return `<aside class="evidence"><h3>Evidencia observada · inmutable</h3><dl><dt>Formato de notificación</dt><dd>${escape(labelFor(contracts, e.contract))}</dd><dt>Origen</dt><dd>No autenticado</dd><dt>Monto observado</dt><dd>${money(o.amount)} ${escape(o.currency)}</dd><dt>Fecha observada</dt><dd>${escape(o.date)}</dd><dt>Hora / zona</dt><dd>${o.localTime ? escape(o.localTime) : "Sin hora"} · zona desconocida</dd>${o.merchant ? `<dt>Comercio</dt><dd>${escape(o.merchant)}</dd>` : ""}${o.instrument ? `<dt>${o.instrument.kind === "account" ? "Cuenta" : "Tarjeta"}</dt><dd>${escape(o.instrument.maskedLast4)}</dd>` : ""}</dl></aside>`;
}
export class FinancialView {
  private controller = new AbortController();
  private disposed = false;
  private sequence = 0;
  private detailSequence = 0;
  private ledgerCursor = "";
  private pendingCursor = "";
  private filter: Record<string, string> = {};
  private proposal: Proposal | null = null;
  constructor(
    private host: HTMLElement,
    private workspace: string,
    private current: () => boolean,
    private denied: () => void,
  ) {
    host.innerHTML = financialShell();
    host.addEventListener("submit", (e) => void this.submit(e), {
      signal: this.controller.signal,
    });
    host.addEventListener("click", (e) => void this.click(e), {
      signal: this.controller.signal,
    });
    void this.revalidate();
  }
  dispose() {
    this.disposed = true;
    this.controller.abort();
    this.proposal = null;
    this.host.replaceChildren();
  }
  private live() {
    return !this.disposed && this.current() && !document.hidden;
  }
  private url(path: string) {
    return `/api/workspaces/${this.workspace}/${path}`;
  }
  private status(text: string) {
    if (this.live())
      this.host.querySelector("#financial-status")!.textContent = text;
  }
  private async request<T>(path: string, method = "GET", body?: unknown) {
    return api<T>(this.url(path), method, body, this.controller.signal);
  }
  private failure(error: unknown) {
    if (!this.live()) return;
    if (error instanceof RequestError && [401, 404].includes(error.status)) {
      this.denied();
      return;
    }
    if (error instanceof DOMException && error.name === "AbortError") return;
    this.status(
      error instanceof RequestError
        ? `No se completó la acción (${error.code}). Revisa el formato y los datos sintéticos.`
        : "No pudimos completar la acción. Reintenta al conectarte.",
    );
  }
  async revalidate() {
    const sequence = ++this.sequence;
    try {
      const query = new URLSearchParams({
        ...this.filter,
        ...(this.ledgerCursor ? { cursor: this.ledgerCursor } : {}),
      });
      const [pending, ledger] = await Promise.all([
        this.request<{
          items: { id: string; fields: Fields }[];
          next: string | null;
        }>(
          "proposals" +
            (this.pendingCursor
              ? "?cursor=" + encodeURIComponent(this.pendingCursor)
              : ""),
        ),
        this.request<{
          items: Entry[];
          next: string | null;
          totals: {
            count: number;
            incoming: number;
            outgoing: number;
            creditPurchases: number;
            unresolved: number;
            unresolvedCount: number;
          };
        }>("ledger?" + query),
      ]);
      if (!this.live() || sequence !== this.sequence) return;
      this.host.querySelector("#pending-list")!.innerHTML = pending.items.length
        ? pending.items
            .map(
              (p) =>
                `<div class="financial-row"><span>${escape(p.fields.label)} · ${money(p.fields.amount)}</span><button class="secondary" data-proposal="${p.id}">Revisar</button></div>`,
            )
            .join("")
        : "<p>No hay propuestas pendientes en esta página.</p>";
      if (pending.next)
        this.host
          .querySelector("#pending-list")!
          .insertAdjacentHTML(
            "beforeend",
            `<button class="secondary" data-pending-next="${pending.next}">Más pendientes</button>`,
          );
      if (this.pendingCursor)
        this.host
          .querySelector("#pending-list")!
          .insertAdjacentHTML(
            "beforeend",
            '<button class="secondary" id="pending-start">Primeros pendientes</button>',
          );
      const t = ledger.totals;
      this.host.querySelector("#ledger-totals")!.innerHTML =
        `<p>${t.count} movimientos en todo el filtro</p><div class="totals"><div>Entradas confirmadas<strong>${money(t.incoming)}</strong></div><div>Salidas confirmadas<strong>${money(t.outgoing)}</strong></div><div>Compras con crédito confirmadas<strong>${money(t.creditPurchases)}</strong></div><div>Sin resolver (${t.unresolvedCount})<strong>${money(t.unresolved)}</strong></div></div>`;
      this.host.querySelector("#ledger-list")!.innerHTML = ledger.items.length
        ? ledger.items
            .map(
              (r) =>
                `<div class="financial-row"><span><strong>${escape(r.label)}</strong><br><small>${escape(r.occurredAt)} · ${escape(labelFor(types, r.type)!)} · ${escape(labelFor(directions, r.direction)!)}</small></span><span>${money(r.amount)}</span><button class="secondary" data-record="${r.id}">Ver detalle</button></div>`,
            )
            .join("")
        : "<p>Aún no hay movimientos para este filtro.</p>";
      if (ledger.next)
        this.host
          .querySelector("#ledger-list")!
          .insertAdjacentHTML(
            "beforeend",
            `<button class="secondary" data-ledger-next="${ledger.next}">Página siguiente</button>`,
          );
      if (this.ledgerCursor)
        this.host
          .querySelector("#ledger-list")!
          .insertAdjacentHTML(
            "beforeend",
            '<button class="secondary" id="ledger-start">Primera página</button>',
          );
    } catch (error) {
      if (sequence === this.sequence) this.failure(error);
    }
  }
  private async open(id: string, pending: boolean) {
    const seq = ++this.detailSequence;
    try {
      const item = await this.request<Proposal & Entry>(
        (pending ? "proposals/" : "ledger/") + id,
      );
      if (!this.live() || seq !== this.detailSequence) return;
      const box = this.host.querySelector<HTMLElement>("#financial-detail")!;
      box.hidden = false;
      this.proposal = pending ? item : null;
      const f = item.fields ?? item;
      box.innerHTML = `<div class="detail-heading"><h2>${pending ? "Revisar propuesta" : "Detalle del movimiento"}</h2><button type="button" id="close-detail" class="secondary">Cerrar detalle</button></div>${evidenceView(item.evidence)}${pending ? `<h3>Propuesta editable</h3><form id="approve-financial"><label for="review-label">Descripción</label><input id="review-label" name="label" maxlength="120" value="${escape(f.label)}" required><div class="filters"><div><label for="review-amount">Monto CLP</label><input id="review-amount" name="amount" type="number" min="1" max="9007199254740991" step="1" value="${f.amount}" required></div><div><label for="review-date">Fecha de operación</label><input id="review-date" name="occurredAt" type="date" value="${escape(f.occurredAt.slice(0, 10))}" required></div></div><label for="review-category">Categoría (opcional)</label><input id="review-category" name="category" maxlength="80" value="${escape(f.category)}"><label for="review-type">Tipo revisado</label><select id="review-type" name="type">${options(types, f.type)}</select><label for="review-direction">Dirección revisada</label><select id="review-direction" name="direction">${options(directions, f.direction)}</select><p>Al aprobar crearás un movimiento persistente. Corregir aquí no modifica la evidencia observada.</p><div class="actions"><button>Aprobar movimiento</button><button id="ignore-financial" type="button" class="secondary">Ignorar y eliminar propuesta</button></div></form>` : `<h3>Campos aprobados</h3><dl><dt>Descripción</dt><dd>${escape(f.label)}</dd><dt>Monto</dt><dd>${money(f.amount)}</dd><dt>Fecha</dt><dd>${escape(f.occurredAt)}</dd><dt>Categoría</dt><dd>${escape(f.category || "Sin asignar")}</dd><dt>Tipo / dirección</dt><dd>${escape(labelFor(types, f.type)!)} · ${escape(labelFor(directions, f.direction)!)}</dd></dl>`}`;
      box.scrollIntoView({ block: "start", behavior: "smooth" });
      box.querySelector<HTMLButtonElement>("#close-detail")!.focus();
    } catch (error) {
      this.failure(error);
    }
  }
  private close() {
    this.detailSequence++;
    this.proposal = null;
    const box = this.host.querySelector<HTMLElement>("#financial-detail")!;
    box.hidden = true;
    box.replaceChildren();
  }
  private async submit(event: Event) {
    const form = event.target as HTMLFormElement;
    if (
      !["import-financial", "approve-financial", "ledger-filter"].includes(
        form.id,
      )
    )
      return;
    event.preventDefault();
    event.stopPropagation();
    if (!this.live()) return;
    const values = Object.fromEntries(new FormData(form));
    try {
      if (form.id === "ledger-filter") {
        this.filter = Object.fromEntries(
          Object.entries(values)
            .filter(([, v]) => v !== "")
            .map(([k, v]) => [k, String(v)]),
        );
        this.ledgerCursor = "";
        await this.revalidate();
      }
      if (form.id === "approve-financial" && this.proposal) {
        const proposal = this.proposal,
          detail = this.detailSequence;
        const result = await this.request<{ id: string }>(
          `proposals/${proposal.id}/approve`,
          "POST",
          {
            fields: { ...values, amount: Number(values.amount) },
            expectedVersion: 1,
          },
        );
        if (!this.live()) return;
        if (detail !== this.detailSequence) {
          void this.revalidate();
          return;
        }
        this.close();
        this.status("Movimiento aprobado.");
        await this.revalidate();
        await this.open(result.id, false);
      }
      if (form.id === "import-financial") {
        const detail = this.detailSequence;
        const file = (form.querySelector<HTMLInputElement>("#synthetic-file")!
          .files ?? [])[0];
        if (!file) {
          this.status(
            "Selecciona un archivo sintético o usa el ejemplo incorporado.",
          );
          return;
        }
        if (file.size > 1048576) {
          this.status("El límite es 1 MiB.");
          return;
        }
        const response = await fetch(
          this.url(
            "imports?contract=" + encodeURIComponent(String(values.contract)),
          ),
          {
            method: "POST",
            credentials: "same-origin",
            headers: {
              "content-type": "application/octet-stream",
              "x-budgeteer-synthetic": "yes",
            },
            body: file,
            signal: this.controller.signal,
          },
        );
        const result = await response.json();
        if (!response.ok) throw new RequestError(response.status, result.code);
        if (!this.live()) return;
        form.reset();
        this.status(
          result.replayed
            ? "Los mismos bytes ya tienen un resultado en este espacio."
            : "Propuesta sintética lista para revisar.",
        );
        await this.revalidate();
        if (detail === this.detailSequence)
          await this.open(result.id, result.state === "pending");
      }
    } catch (error) {
      this.failure(error);
    }
  }
  private async click(event: Event) {
    const b = (event.target as HTMLElement).closest<HTMLButtonElement>(
      "button",
    );
    if (!b) return;
    try {
      if (b.id === "synthetic-example") {
        const detail = this.detailSequence;
        const contract =
          this.host.querySelector<HTMLSelectElement>("#contract")!.value;
        const result = await this.request<{
          id: string;
          state: string;
          replayed: boolean;
        }>("synthetic-example", "POST", { contract });
        if (!this.live()) return;
        this.status(
          result.replayed
            ? "Ejemplo ya importado: abrimos el resultado existente."
            : "Ejemplo sintético listo para revisar.",
        );
        await this.revalidate();
        if (detail === this.detailSequence)
          await this.open(result.id, result.state === "pending");
      }
      if (b.dataset.proposal) await this.open(b.dataset.proposal, true);
      if (b.dataset.record) await this.open(b.dataset.record, false);
      if (b.id === "close-detail") this.close();
      if (b.id === "ignore-financial" && this.proposal) {
        const detail = this.detailSequence;
        await this.request(`proposals/${this.proposal.id}`, "DELETE", {});
        if (!this.live()) return;
        if (detail !== this.detailSequence) {
          void this.revalidate();
          return;
        }
        this.close();
        this.status("Propuesta, evidencia y marca de repetición eliminadas.");
        await this.revalidate();
      }
      if (b.dataset.ledgerNext || b.id === "ledger-start") {
        this.ledgerCursor = b.dataset.ledgerNext ?? "";
        await this.revalidate();
      }
      if (b.dataset.pendingNext || b.id === "pending-start") {
        this.pendingCursor = b.dataset.pendingNext ?? "";
        await this.revalidate();
      }
      if (b.id === "clear-filters") {
        this.host.querySelector<HTMLFormElement>("#ledger-filter")!.reset();
        this.filter = {};
        this.ledgerCursor = "";
        await this.revalidate();
      }
    } catch (error) {
      this.failure(error);
    }
  }
}
