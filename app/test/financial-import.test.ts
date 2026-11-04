import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeMime } from "../server/imports/decode.js";
import {
  syntheticMime,
  syntheticLines,
  importContracts,
} from "../server/imports/synthetic.js";
import { MimeParser } from "../server/imports/parser.js";
import { UploadAdmission } from "../server/http/uploads.js";
const mime = (text: string, type = "text/plain", encoding = "8bit") =>
  Buffer.from(
    `MIME-Version: 1.0\r\nContent-Type: ${type}; charset=utf-8\r\nContent-Transfer-Encoding: ${encoding}\r\n\r\n${text}`,
  );
const contract = "banco_chile_debit_v1";
const lines = syntheticLines(contract);
test("five runtime MIME examples preserve released semantics", async () => {
  for (const c of importContracts) {
    const result = await decodeMime(Buffer.from(syntheticMime(c)), c);
    assert.equal(result.evidence.timezone, "unknown");
    assert.equal(result.proposedFields.direction, "outgoing");
    assert.equal(result.proposedFields.occurredAt, "2026-11-04");
  }
});
test("maintained decoder handles base64, quoted printable and structural HTML label tables", async () => {
  const text = lines.join("\n");
  const encoded = Buffer.from(text)
    .toString("hex")
    .match(/../g)!
    .map((h) => "=" + h.toUpperCase())
    .join("");
  const qp = await decodeMime(
    mime(encoded, "text/plain", "quoted-printable"),
    contract,
  );
  assert.equal(qp.proposedFields.amount, 12500);
  const html = `<html><head><script>fetch('https://invalid.test')</script></head><body><h1>${lines[0]}</h1><p>${lines[1]}</p><table><tr><td>Comercio</td><td>Almacén Sintético</td></tr><tr><td>Monto</td><td>$12.500</td></tr><tr><td>Fecha</td><td>04/11/2026</td></tr><tr><td>Hora</td><td>14:25</td></tr><tr><td>Cuenta</td><td>****4321</td></tr></table><img src="https://invalid.test/x"></body></html>`;
  const result = await decodeMime(mime(html, "text/html"), contract);
  assert.deepEqual(result, qp);
  for (const [before, after] of [
    ["$12.500</td>", "$13.500</td>"],
    ["04/11/2026</td>", "05/11/2026</td>"],
    ["Almacén Sintético</td>", "Otro Comercio</td>"],
    ["****4321</td>", "****9876</td>"],
    ["14:25</td>", "14:26</td>"],
  ])
    await assert.rejects(
      decodeMime(mime(html.replace(before!, after!), "text/html"), contract),
      /AMBIGUOUS_INPUT/,
    );
  await assert.rejects(
    decodeMime(
      mime(
        html.replace(
          "<table>",
          "<div hidden>Otra compra por $90.000</div><table>",
        ),
        "text/html",
      ),
      contract,
    ),
    /UNSUPPORTED_FORMAT/,
  );
  await assert.rejects(
    decodeMime(
      mime(
        html.replace("Fecha</td>", "Fecha de vencimiento</td>"),
        "text/html",
      ),
      contract,
    ),
    /UNSUPPORTED_FORMAT/,
  );
});
test("conflicting alternatives/narratives/unknown formats, attachments, malformed and oversize fail safely", async () => {
  const alternative = Buffer.from(
    `MIME-Version: 1.0\r\nContent-Type: multipart/alternative; boundary=synthetic-boundary\r\n\r\n--synthetic-boundary\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${lines.join("\n")}\r\n--synthetic-boundary\r\nContent-Type: text/html; charset=utf-8\r\n\r\n<h1>${lines[0]}</h1><p>${lines[1]!.replace("12.500", "13.500")}</p>\r\n--synthetic-boundary--`,
  );
  await assert.rejects(decodeMime(alternative, contract), /AMBIGUOUS_INPUT/);
  await assert.rejects(
    decodeMime(mime([...lines, lines[1]].join("\n")), contract),
    /AMBIGUOUS_INPUT/,
  );
  await assert.rejects(
    decodeMime(
      mime("Aviso de Transferencia de Fondos"),
      "santander_sent_transfer_v1",
    ),
  );
  const attachment = Buffer.from(
    "MIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary=b\r\n\r\n--b\r\nContent-Type: application/octet-stream\r\nContent-Disposition: attachment\r\n\r\ninvented attachment\r\n--b--",
  );
  await assert.rejects(decodeMime(attachment, contract), /UNSUPPORTED_FORMAT/);
  await assert.rejects(
    decodeMime(Buffer.from("not MIME"), contract),
    /INVALID_INPUT/,
  );
  await assert.rejects(
    decodeMime(Buffer.alloc(1048577), contract),
    /INVALID_INPUT/,
  );
  await assert.rejects(
    decodeMime(mime(lines.join("\n")), "unknown"),
    /UNSUPPORTED_CONTRACT/,
  );
});
test("terminable worker deadline, zero queue, cancellation and admission release", async () => {
  const parser = new MimeParser(
    50,
    new URL("data:text/javascript,while(true){}"),
  );
  const raw = Buffer.from(syntheticMime(contract));
  const a = parser.parse(raw, contract),
    b = parser.parse(raw, contract);
  await assert.rejects(parser.parse(raw, contract), /PARSER_BUSY/);
  await Promise.all([
    assert.rejects(a, /PARSER_TIMEOUT/),
    assert.rejects(b, /PARSER_TIMEOUT/),
  ]);
  assert.equal(parser.activeCount, 0);
  const controller = new AbortController();
  const c = parser.parse(raw, contract, controller.signal);
  controller.abort();
  await assert.rejects(c, /UPLOAD_ABORTED/);
  assert.equal(parser.activeCount, 0);
  await parser.close();
  const admission = new UploadAdmission(),
    release = [admission.acquire("a"), admission.acquire("a")];
  assert.throws(
    () => admission.acquire("a"),
    (e) => e instanceof Error && "status" in e && e.status === 429,
  );
  for (const actor of ["b", "c", "d"])
    release.push(admission.acquire(actor), admission.acquire(actor));
  assert.equal(admission.activeCount, 8);
  assert.throws(
    () => admission.acquire("e"),
    (e) => e instanceof Error && "status" in e && e.status === 503,
  );
  release.forEach((r) => {
    r();
    r();
  });
  assert.equal(admission.activeCount, 0);
  admission.acquire("a")();
  assert.equal(admission.activeCount, 0);
});
