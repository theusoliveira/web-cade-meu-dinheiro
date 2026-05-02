export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type EntryKind = "income" | "expense" | "investment";

type EntriesInsert = {
  id: string;
  kind: EntryKind;
  date: string;
  category: string;
  description?: string | null;
  value: number;
  fixed_entry_id?: string | null;
};

type FixedEntriesInsert = {
  id: string;
  kind: EntryKind;
  category: string;
  description: string;
  day_of_month: number;
};

type CardEntriesInsert = {
  id: string;
  kind: "income" | "expense";
  date: string;
  category: string;
  description?: string | null;
  value: number;
};

type GoalsInsert = {
  id: string;
  description: string;
  current_value: number;
  target_value: number;
  forecast: string;
};

type EntryRow = {
  id: string;
  kind: EntryKind;
  date: string;
  category: string;
  description: string | null;
  value: number | string;
  fixed_entry_id: string | null;
  created_at: string;
};

type FixedEntryRow = {
  id: string;
  kind: EntryKind;
  category: string | null;
  description: string | null;
  day_of_month: number | string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      entries: {
        Row: EntryRow;
        Insert: EntriesInsert;
        Update: Partial<EntriesInsert>;
        Relationships: [];
      };
      fixed_entries: {
        Row: FixedEntryRow;
        Insert: FixedEntriesInsert;
        Update: Partial<FixedEntriesInsert>;
        Relationships: [];
      };
      pj_entries: {
        Row: EntryRow;
        Insert: EntriesInsert;
        Update: Partial<EntriesInsert>;
        Relationships: [];
      };
      pj_fixed_entries: {
        Row: FixedEntryRow;
        Insert: FixedEntriesInsert;
        Update: Partial<FixedEntriesInsert>;
        Relationships: [];
      };
      card_entries: {
        Row: {
          id: string;
          kind: EntryKind;
          date: string;
          category: string;
          description: string | null;
          value: number | string;
          created_at: string;
        };
        Insert: CardEntriesInsert;
        Update: Partial<CardEntriesInsert>;
        Relationships: [];
      };
      pj_salary_settings: {
        Row: {
          id: string;
          month_year: string;
          hours: number | string;
          hourly_rate: number | string;
          commission: number | string;
          accounting: number | string;
          inss: number | string;
          simples_override: number | string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          month_year: string;
          hours?: number;
          hourly_rate?: number;
          commission?: number;
          accounting?: number;
          inss?: number;
          simples_override?: number | null;
          updated_at?: string;
        };
        Update: Partial<{
          hours: number;
          hourly_rate: number;
          commission: number;
          accounting: number;
          inss: number;
          simples_override: number | null;
          updated_at: string;
        }>;
        Relationships: [];
      };
      pj_salary_categories: {
        Row: {
          id: string;
          month_year: string;
          name: string;
          sort_order: number | string;
          created_at: string;
        };
        Insert: {
          id: string;
          month_year: string;
          name: string;
          sort_order?: number;
        };
        Update: Partial<{ name: string; sort_order: number }>;
        Relationships: [];
      };
      pj_salary_items: {
        Row: {
          id: string;
          category_id: string;
          description: string;
          value: number | string;
          created_at: string;
        };
        Insert: {
          id: string;
          category_id: string;
          description: string;
          value: number;
        };
        Update: Partial<{ description: string; value: number }>;
        Relationships: [];
      };
      goals: {
        Row: {
          id: string;
          description: string | null;
          current_value: number | string | null;
          target_value: number | string | null;
          forecast: string | null;
          created_at: string;
        };
        Insert: GoalsInsert;
        Update: Partial<GoalsInsert>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          full_name: string | null;
        };
        Insert: { id: string; display_name?: string | null; full_name?: string | null };
        Update: { display_name?: string | null; full_name?: string | null };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      cpf_exists: {
        Args: { cpf_in: string };
        Returns: boolean;
      };
      get_opening_balance: {
        Args: { month_start: string };
        Returns: number | string | null;
      };
      get_pj_opening_balance: {
        Args: { month_start: string };
        Returns: number | string | null;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
