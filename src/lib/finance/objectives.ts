/** Campos usados na projeção de um objetivo (taxa em % ao mês). */
export type ObjectiveParams = {
  initialValue: number;
  targetValue: number;
  monthlyContribution: number;
  monthlyRate: number;
};

/** Limite da simulação: 100 anos. */
const MAX_MONTHS = 1200;

function addMonths(ym: string, n: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const label = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(y, m - 1, 1));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Simula saldo(m) = saldo(m-1) × (1 + taxa) + aporte, partindo do valor atual no mês corrente.
 * Retorna o mês em que o saldo atinge o alvo, ou null se não atingir em MAX_MONTHS.
 */
export function completionMonth(o: ObjectiveParams, currentMonth: string): { month: string; months: number } | null {
  if (o.initialValue >= o.targetValue) return { month: currentMonth, months: 0 };
  const rate = o.monthlyRate / 100;
  let balance = o.initialValue;
  for (let i = 1; i <= MAX_MONTHS; i++) {
    balance = balance * (1 + rate) + o.monthlyContribution;
    if (balance >= o.targetValue) return { month: addMonths(currentMonth, i), months: i };
  }
  return null;
}

export function durationLabel(months: number): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  const parts = [];
  if (y) parts.push(`${y} ${y === 1 ? "ano" : "anos"}`);
  if (m) parts.push(`${m} ${m === 1 ? "mês" : "meses"}`);
  return parts.join(" e ") || "já atingido";
}
