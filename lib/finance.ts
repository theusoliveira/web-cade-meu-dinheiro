export type EntryKind = "income" | "expense" | "investment";

export type IncomeCategory = string;
export type ExpenseCategory = string;
export type InvestmentCategory = string;

export type Category = IncomeCategory | ExpenseCategory | InvestmentCategory;

export type FinanceEntry = {
  id: string;
  kind: EntryKind;
  /** YYYY-MM-DD (from <input type="date" />) */
  date: string;
  category: Category;
  description: string;
  /** Always stored as a positive number. UI can render + / - based on kind. */
  value: number;
  createdAt: number;

  /**
   * Se este lançamento foi criado a partir de um template de lançamento fixo,
   * este campo referencia o `fixed_entries.id`.
   */
  fixedEntryId?: string | null;

  /**
   * Linha "virtual" gerada a partir de um lançamento fixo (não existe na tabela `entries`).
   * Serve apenas para UI (aparece com valor 0) e, ao editar, vira uma ocorrência real.
   */
  isVirtualFixed?: boolean;

  /**
   * Usado pelo modal para indicar que o usuário está cadastrando um template de lançamento fixo.
   * (Não é um lançamento real do mês.)
   */
  isFixedTemplate?: boolean;
};

export const INCOME_CATEGORIES: IncomeCategory[] = [
  "Salário",
  "Renda extra",
  "Empréstimo",
  "Saldo",
  "Outros",
];
export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Carro",
  "Lazer",
  "Mercado",
  "Saúde",
  "Casa",
  "Presente",
  "Educação",
  "Cartão de crédito",
  "Roupa",
  "Outros",
];
export const INVESTMENT_CATEGORIES: InvestmentCategory[] = [
  "Reserva",
  "Aposentadoria",
  "Casa própria",
];

export const CATEGORIES_BY_KIND: Record<EntryKind, readonly Category[]> = {
  income: INCOME_CATEGORIES,
  expense: EXPENSE_CATEGORIES,
  investment: INVESTMENT_CATEGORIES,
};

export function categoriesFor(kind: EntryKind): readonly Category[] {
  return CATEGORIES_BY_KIND[kind];
}

export function kindLabel(kind: EntryKind): string {
  switch (kind) {
    case "income":
      return "Receita";
    case "expense":
      return "Despesa";
    case "investment":
      return "Investimento";
  }
}

export function kindPrefix(kind: EntryKind): string {
  return kind === "expense" ? "-" : "+";
}

export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDateBR(dateYYYYMMDD: string): string {
  // Parse as local date to avoid timezone surprises.
  const [y, m, d] = dateYYYYMMDD.split("-").map((x) => Number(x));
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return new Intl.DateTimeFormat("pt-BR").format(dt);
}

export function todayAsDateInputValue(now: Date = new Date()): string {
  const tzOffsetMs = now.getTimezoneOffset() * 60 * 1000;
  const local = new Date(now.getTime() - tzOffsetMs);
  return local.toISOString().slice(0, 10);
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback UUID v4
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function parseBRLCents(raw: string): number {
  // mantém só números: "R$ 1.234,56" -> "123456"
  const digits = raw.replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

export function formatBRLFromCents(cents: number): string {
  return formatCurrencyBRL(cents / 100);
}
