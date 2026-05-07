import type { Category, EntryKind, ExpenseCategory, IncomeCategory, InvestmentCategory } from "./types";

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
