import { MailParser } from "mailparser";
import { parse } from "parse5";
import { AppError } from "../domain/model.js";
import {
  parsePurchaseText,
  type PurchaseEvidence,
} from "./purchase-adapters.js";
import {
  parseSentTransferText,
  type TransferEvidence,
} from "./transfer-adapter.js";
import { importContracts, type ImportContract } from "./synthetic.js";
import type { ReviewedFields } from "../domain/model.js";
export interface DecodedImport {
  proposedFields: ReviewedFields;
  evidence: PurchaseEvidence | TransferEvidence;
}
const fail = (code = "UNSUPPORTED_FORMAT"): never => {
  throw new AppError(422, code);
};
// Structural parsing only. No DOM, resource loading, execution or HTML rendering.
export function htmlLines(html: string): string[] {
  const root = parse(html);
  const chunks: string[] = [];
  const blocks = new Set([
    "p",
    "div",
    "tr",
    "td",
    "th",
    "br",
    "h1",
    "h2",
    "h3",
    "li",
    "table",
    "section",
  ]);
  function walk(node: any, depth: number) {
    if (depth > 100) fail("INVALID_INPUT");
    if (
      [
        "script",
        "style",
        "head",
        "template",
        "noscript",
        "svg",
        "iframe",
        "object",
      ].includes(node.tagName)
    )
      return;
    if (
      node.attrs?.some(
        (a: any) =>
          a.name === "hidden" ||
          (a.name === "aria-hidden" && a.value === "true") ||
          (a.name === "style" &&
            /display\s*:\s*none|visibility\s*:\s*hidden/i.test(a.value)),
      )
    )
      fail("UNSUPPORTED_FORMAT");
    if (blocks.has(node.tagName)) chunks.push("\n");
    if (node.nodeName === "#text") chunks.push(node.value);
    for (const child of node.childNodes || []) walk(child, depth + 1);
    if (blocks.has(node.tagName)) chunks.push("\n");
  }
  walk(root, 0);
  return lines(chunks.join(""));
}
function lines(value: string): string[] {
  if (value.length > 262144 || /[\p{Cf}]/u.test(value)) fail("INVALID_INPUT");
  return value
    .split(/\r?\n/)
    .map((v) => v.replace(/[\t \u00a0]+/g, " ").trim())
    .filter(Boolean);
}
function extract(contract: ImportContract, input: string[]): DecodedImport {
  // Strict released envelope: every visible field must be accounted for. An
  // unfamiliar surrounding table is unsupported rather than guessed or ignored.
  if (input.length > 32) fail("AMBIGUOUS_INPUT");
  let result;
  if (contract === "santander_sent_transfer_v1") {
    if (input.length !== 4) fail("AMBIGUOUS_INPUT");
    result = parseSentTransferText({
      contract,
      title: input[0],
      dateNarrative: input[1],
      amountLabel: input[2],
      amountText: input[3],
    });
  } else {
    if (input.length < 2) fail("UNSUPPORTED_FORMAT");
    result = parsePurchaseText({
      contract,
      title: input[0],
      narrative: input[1],
    });
  }
  if (!result.ok) return fail(result.code);
  if (contract !== "santander_sent_transfer_v1") {
    const observed = result.evidence as PurchaseEvidence;
    if ((input.length - 2) % 2) fail("AMBIGUOUS_INPUT");
    const seen = new Set<string>();
    for (let i = 2; i < input.length; i += 2) {
      const label = input[i]!.replace(/:$/, ""),
        value = input[i + 1]!;
      if (seen.has(label)) fail("AMBIGUOUS_INPUT");
      seen.add(label);
      const date = observed.date.split("-").reverse().join("/");
      let matches = false;
      if (["Comercio", "Destino"].includes(label))
        matches = value === observed.merchant;
      else if (label === "Monto")
        matches =
          /^\$ ?[1-9]\d{0,2}(?:\.\d{3})*$/.test(value) &&
          Number(value.replace(/[\$ .]/g, "")) === observed.amount;
      else if (label === "Fecha") matches = value === date;
      else if (label === "Hora") matches = value === observed.localTime;
      else if (
        (observed.instrument.kind === "account" &&
          ["Origen", "Cuenta"].includes(label)) ||
        (observed.instrument.kind === "card" &&
          ["Tarjeta", "Card", "Origen"].includes(label))
      )
        matches =
          value === observed.instrument.maskedLast4 ||
          (contract.startsWith("santander_") &&
            value === observed.instrument.maskedLast4.slice(-4));
      else fail("UNSUPPORTED_FORMAT");
      if (!matches) fail("AMBIGUOUS_INPUT");
    }
  }
  return { proposedFields: result.proposedFields, evidence: result.evidence };
}
export async function decodeMime(
  raw: Buffer,
  selected: string,
): Promise<DecodedImport> {
  if (!importContracts.includes(selected as ImportContract))
    fail("UNSUPPORTED_CONTRACT");
  if (!raw.length || raw.length > 1048576) fail("INVALID_INPUT");
  // Require a MIME header/body delimiter; mailparser deliberately tolerates bare text.
  if (
    !raw
      .subarray(0, Math.min(raw.length, 65536))
      .includes(Buffer.from("\r\n\r\n")) &&
    !raw.subarray(0, Math.min(raw.length, 65536)).includes(Buffer.from("\n\n"))
  )
    fail("INVALID_INPUT");
  // Stream attachments: reject without consuming their content or retaining metadata.
  const parsed = await new Promise<{ text?: string; html?: string | false }>(
    (resolve, reject) => {
      const parser = new MailParser({
        skipHtmlToText: true,
        skipTextToHtml: true,
        skipImageLinks: true,
        maxHtmlLengthToParse: 262144,
      });
      let text: { text?: string; html?: string | false } = {};
      let failed = false;
      parser.on("data", (part) => {
        if (part.type === "attachment") {
          failed = true;
          part.content.destroy();
          part.release?.();
          parser.destroy();
          reject(new AppError(422, "UNSUPPORTED_FORMAT"));
        } else text = { text: part.text, html: part.html };
      });
      parser.once("error", () => reject(new AppError(422, "INVALID_INPUT")));
      parser.once("end", () => {
        if (!failed) resolve(text);
      });
      parser.end(raw);
    },
  );
  const variants: DecodedImport[] = [];
  if (parsed.text?.trim())
    variants.push(extract(selected as ImportContract, lines(parsed.text)));
  if (typeof parsed.html === "string" && parsed.html.trim())
    variants.push(extract(selected as ImportContract, htmlLines(parsed.html)));
  if (!variants.length) fail();
  if (variants.some((v) => JSON.stringify(v) !== JSON.stringify(variants[0])))
    fail("AMBIGUOUS_INPUT");
  return variants[0]!;
}
