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
      pj_distribution_months: {
        Row: {
          id: string;
          month: string;
          hours: number | string;
          hourly_rate: number | string;
          commission: number | string;
          simples_auto: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          month: string;
          hours: number;
          hourly_rate: number;
          commission: number;
          simples_auto: boolean;
        };
        Update: {
          hours?: number;
          hourly_rate?: number;
          commission?: number;
          simples_auto?: boolean;
        };
        Relationships: [];
      };
      pj_distribution_categories: {
        Row: {
          id: string;
          month: string;
          name: string;
          is_fixed: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id: string;
          month: string;
          name: string;
          is_fixed: boolean;
          sort_order: number;
        };
        Update: { name?: string; sort_order?: number };
        Relationships: [];
      };
      pj_distribution_items: {
        Row: {
          id: string;
          category_id: string;
          description: string;
          value: number | string;
          item_key: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id: string;
          category_id: string;
          description: string;
          value: number;
          item_key?: string | null;
          sort_order: number;
        };
        Update: { description?: string; value?: number; sort_order?: number };
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
