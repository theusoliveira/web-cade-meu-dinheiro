"use client";

import * as React from "react";
import { AddEntryDialog } from "./AddEntryDialog";
import { ThemeToggle } from "./ThemeToggle";
import { SiteNav } from "./SiteNav";
import { GoalsClient } from "./GoalsClient";
import { EntriesClient } from "./EntriesClient";
import { CardControlClient } from "./CardControlClient";
import { useBusy } from "./BusyProvider";
import { UserMenu } from "./UserMenu";

import { todayAsDateInputValue, type EntryKind, type FinanceEntry } from "../lib/finance";
import { supabase } from "../lib/supabaseClient";

function nextMonthStart(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  let yy = y;
  let mm = m + 1;
  if (mm === 13) {
    yy += 1;
    mm = 1;
  }
  return `${yy}-${String(mm).padStart(2, "0")}-01`;
}

function mapDbRows(data: any[] | null | undefined): FinanceEntry[] {
  return (data ?? []).map((r) => ({
    id: r.id,
    kind: r.kind as EntryKind,
    date: r.date as string,
    category: r.category as any,
    description: (r.description ?? "") as string,
    value: Number(r.value),
    createdAt: new Date(r.created_at as string).getTime(),
  }));
}

export function HomeClient() {
  const [month, setMonth] = React.useState(() => todayAsDateInputValue().slice(0, 7));
  const [activeTab, setActiveTab] =
    React.useState<"lancamentos" | "controle" | "metas">("lancamentos");

  const [entries, setEntries] = React.useState<FinanceEntry[]>([]);
  const [cardEntries, setCardEntries] = React.useState<FinanceEntry[]>([]);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [kind, setKind] = React.useState<EntryKind>("income");
  const [editing, setEditing] = React.useState<FinanceEntry | null>(null);

  const [displayName, setDisplayName] = React.useState<string>("");

  const busy = useBusy();

  React.useEffect(() => {
    let alive = true;

    async function loadProfile() {
      await busy.run(async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const userId = user?.id;
        if (!userId) return;

        const { data, error } = await supabase
          .from("profiles")
          .select("display_name, full_name")
          .eq("id", userId)
          .single();

        if (error) {
          console.error(error);
          return;
        }

        if (!alive) return;
        setDisplayName((data?.display_name ?? data?.full_name ?? "").toString());
      });
    }

    loadProfile();
    return () => {
      alive = false;
    };
    // busy.run is stable (useCallback). Keeping deps empty intentionally.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    setDialogOpen(false);
    setEditing(null);
  }, [activeTab]);

  async function fetchEntriesMonth(ym: string) {
    const start = `${ym}-01`;
    const next = nextMonthStart(ym);

    await busy.run(async () => {
      const { data, error } = await supabase
        .from("entries")
        .select("id, kind, date, category, description, value, created_at")
        .gte("date", start)
        .lt("date", next)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }
      setEntries(mapDbRows(data));
    });
  }

  // >>> Controle de gastos agora é “único” (sem mês)
  async function fetchCardAll() {
    await busy.run(async () => {
      const { data, error } = await supabase
        .from("card_entries")
        .select("id, kind, date, category, description, value, created_at")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }
      setCardEntries(mapDbRows(data));
    });
  }

  React.useEffect(() => {
    if (activeTab !== "lancamentos") return;
    fetchEntriesMonth(month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, activeTab]);

  React.useEffect(() => {
    if (activeTab !== "controle") return;
    fetchCardAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  function openDialog(nextKind: EntryKind) {
    setKind(nextKind);
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(entry: FinanceEntry) {
    setKind(entry.kind);
    setEditing(entry);
    setDialogOpen(true);
  }

  async function upsertEntry(entry: FinanceEntry) {
    await busy.run(async () => {
      const payload = {
        id: entry.id,
        kind: entry.kind,
        date: entry.date,
        category: entry.category,
        description: entry.description,
        value: entry.value,
      };

      const exists = entries.some((p) => p.id === entry.id);

      const q = exists
        ? supabase.from("entries").update(payload).eq("id", entry.id)
        : supabase.from("entries").insert(payload);

      const { error } = await q;
      if (error) {
        console.error(error);
        alert("Erro ao salvar. Veja o console.");
        return;
      }

      await fetchEntriesMonth(month);
    });
  }

  async function upsertCardEntry(entry: FinanceEntry) {
    if (entry.kind === "investment") {
      alert("No Controle de gastos, só é permitido Receita ou Despesa.");
      return;
    }

    await busy.run(async () => {
      const payload = {
        id: entry.id,
        kind: entry.kind,
        date: entry.date,
        category: entry.category,
        description: entry.description,
        value: entry.value,
      };

      const exists = cardEntries.some((p) => p.id === entry.id);

      const q = exists
        ? supabase.from("card_entries").update(payload).eq("id", entry.id)
        : supabase.from("card_entries").insert(payload);

      const { error } = await q;
      if (error) {
        console.error(error);
        alert("Erro ao salvar (cartão). Veja o console.");
        return;
      }

      await fetchCardAll();
    });
  }

  async function deleteEntry(entry: FinanceEntry) {
    await busy.run(async () => {
      const { error } = await supabase.from("entries").delete().eq("id", entry.id);
      if (error) {
        console.error(error);
        alert("Erro ao excluir. Veja o console.");
        return;
      }
      await fetchEntriesMonth(month);
    });
  }

  async function deleteCardEntry(entry: FinanceEntry) {
    await busy.run(async () => {
      const { error } = await supabase.from("card_entries").delete().eq("id", entry.id);
      if (error) {
        console.error(error);
        alert("Erro ao excluir (cartão). Veja o console.");
        return;
      }
      await fetchCardAll();
    });
  }

  // >>> Excluir TODOS os lançamentos do Controle de gastos
  async function deleteAllCardEntries() {
    await busy.run(async () => {
      // Supabase/PostgREST normalmente exige um filtro em DELETE.
      // Este filtro pega “tudo” (datas sempre serão >= 0001-01-01).
      const { error } = await supabase.from("card_entries").delete().gte("date", "0001-01-01");

      if (error) {
        console.error(error);
        alert("Erro ao excluir todos (cartão). Veja o console.");
        return;
      }

      setCardEntries([]);
    });
  }

  const visibleEntries = activeTab === "controle" ? cardEntries : entries;
  const onSubmit = activeTab === "controle" ? upsertCardEntry : upsertEntry;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <header className="border-b border-zinc-200/60 bg-white/70 backdrop-blur dark:border-zinc-800/60 dark:bg-zinc-950/70">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
              $
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">Cadê meu dinheiro?</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{displayName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <SiteNav active={activeTab} onChange={setActiveTab} />
            <ThemeToggle />
            <UserMenu displayName={displayName} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {activeTab === "lancamentos" ? (
          <EntriesClient
            month={month}
            setMonth={setMonth}
            entries={visibleEntries}
            openDialog={openDialog}
            onEdit={openEdit}
            onDelete={(entry) => {
              const ok = window.confirm(
                `Excluir este lançamento?\n\n${entry.description} — ${entry.value}`
              );
              if (ok) deleteEntry(entry);
            }}
          />
        ) : null}

        {activeTab === "controle" ? (
          <CardControlClient
            entries={visibleEntries}
            openDialog={(k) => openDialog(k)}
            onEdit={openEdit}
            onDelete={(entry) => {
              const ok = window.confirm(
                `Excluir este lançamento do cartão?\n\n${entry.description} — ${entry.value}`
              );
              if (ok) deleteCardEntry(entry);
            }}
            onDeleteAll={deleteAllCardEntries}
          />
        ) : null}

        {activeTab === "metas" ? <GoalsClient /> : null}

        <AddEntryDialog
          open={dialogOpen}
          kind={kind}
          onClose={() => {
            setDialogOpen(false);
            setEditing(null);
          }}
          initial={editing}
          onSubmit={onSubmit}
        />
      </main>
    </div>
  );
}
