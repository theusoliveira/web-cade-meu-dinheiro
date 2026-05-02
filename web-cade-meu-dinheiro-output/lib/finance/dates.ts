export function todayAsDateInputValue(now: Date = new Date()): string {
  const tzOffsetMs = now.getTimezoneOffset() * 60 * 1000;
  const local = new Date(now.getTime() - tzOffsetMs);
  return local.toISOString().slice(0, 10);
}

export function nextMonthStart(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  let yy = y;
  let mm = m + 1;
  if (mm === 13) {
    yy += 1;
    mm = 1;
  }
  return `${yy}-${String(mm).padStart(2, "0")}-01`;
}

export function lastDayOfMonthFromYM(ym: string): number {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

/** Formato abreviado (ex.: "abr. de 2026") — usado em tabelas compactas. */
export function monthShortLabel(ym: string): string {
  if (!ym) return "-";
  const [y, m] = ym.split("-").map((v) => Number(v));
  const dt = new Date(y, (m ?? 1) - 1, 1);
  return new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric" }).format(dt);
}

export function monthLabel(ym: string): string {
  if (!ym) return "Todos os meses";
  const [y, m] = ym.split("-").map((v) => Number(v));
  const dt = new Date(y, (m ?? 1) - 1, 1);
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(dt);
}
