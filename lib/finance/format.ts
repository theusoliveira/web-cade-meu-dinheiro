export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDateBR(dateYYYYMMDD: string): string {
  const [y, m, d] = dateYYYYMMDD.split("-").map((x) => Number(x));
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return new Intl.DateTimeFormat("pt-BR").format(dt);
}

export function parseBRLCents(raw: string): number {
  const digits = raw.replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

export function formatBRLFromCents(cents: number): string {
  return formatCurrencyBRL(cents / 100);
}
