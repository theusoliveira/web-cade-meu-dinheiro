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
  fixedEntryId?: string | null;
  isVirtualFixed?: boolean;
  isFixedTemplate?: boolean;
  isAutoCarryover?: boolean;
};

export type FixedEntry = {
  id: string;
  kind: EntryKind;
  category: string;
  description: string;
  dayOfMonth: number;
  createdAt: number;
};
