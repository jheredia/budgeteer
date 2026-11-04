/** Structured invented examples; MIME exists only in memory at the call boundary. */
export const importContracts = [
  "banco_chile_debit_v1",
  "banco_chile_credit_v1",
  "santander_debit_v1",
  "santander_credit_v1",
  "santander_sent_transfer_v1",
] as const;
export type ImportContract = (typeof importContracts)[number];
export function syntheticLines(contract: ImportContract): string[] {
  if (contract === "santander_sent_transfer_v1")
    return [
      "Comprobante Transferencia de fondos",
      "Te enviamos el detalle de la transferencia realizada el 04/11/2026.",
      "Monto transferido",
      "$ 23.000",
    ];
  const credit = contract.includes("credit");
  return contract.startsWith("banco_chile")
    ? [
        credit ? "Compra con Tarjeta de Crédito" : "Cargo en Cuenta",
        `Te informamos que se ha realizado una compra por $12.500 ${credit ? "con Tarjeta de Crédito" : "con cargo a Cuenta"} ****4321 en Almacén Sintético el 04/11/2026 14:25.`,
      ]
    : [
        "Transacción por $12.500",
        `Se realizó una compra con tu Tarjeta de ${credit ? "Crédito" : "Débito"} terminada en 4321 en Almacén Sintético, el 04/11/2026.`,
      ];
}
export function syntheticMime(contract: ImportContract): string {
  return (
    "MIME-Version: 1.0\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" +
    Buffer.from(syntheticLines(contract).join("\n")).toString("base64")
  );
}
