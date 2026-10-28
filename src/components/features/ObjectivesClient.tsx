"use client";

import * as React from "react";
import { AlertCircle, CalendarCheck, Pencil, Trash2, TrendingUp, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useBusy } from "@/components/features/BusyProvider";
import { formatBRLFromCents, formatCurrencyBRL, newId, parseBRLCents, todayAsDateInputValue } from "@/lib/finance";
import { completionMonth, durationLabel, monthLabel } from "@/lib/finance/objectives";
import {
  deleteObjective,
  fetchObjectives,
  upsertObjective,
  type ObjectiveRecord,
} from "@/actions/objectives";

export function ObjectivesClient() {
  const [objectives, setObjectives] = React.useState<ObjectiveRecord[]>([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ObjectiveRecord | null>(null);
  const { run } = useBusy();

  const reload = React.useCallback(async () => {
    await run(async () => {
      try {
        setObjectives(await fetchObjectives());
      } catch (error) {
        console.error(error);
      }
    });
  }, [run]);

  React.useEffect(() => { reload(); }, [reload]);

  function openNew() { setEditing(null); setDialogOpen(true); }
  function openEdit(o: ObjectiveRecord) { setEditing(o); setDialogOpen(true); }

  async function save(o: ObjectiveRecord) {
    await upsertObjective(o);
    setObjectives(await fetchObjectives());
  }

  async function remove(o: ObjectiveRecord) {
    const ok = window.confirm(`Excluir este objetivo?\n\n${o.name}`);
    if (!ok) return;
    await run(async () => {
      try {
        await deleteObjective(o.id);
        setObjectives((prev) => prev.filter((x) => x.id !== o.id));
      } catch (error) {
        console.error(error);
        alert("Erro ao excluir objetivo. Veja o console.");
      }
    });
  }

  const currentMonth = todayAsDateInputValue().slice(0, 7);

  return (
    <>
      <div className="grid gap-6 animate-fade-in">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-[var(--foreground)]">Objetivos</h1>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Cadastre objetivos com aporte mensal e taxa e veja quando cada um será concluído.
              </p>
            </div>
            <Button onClick={openNew} size="sm">+ Novo objetivo</Button>
          </div>
        </div>

        {!objectives.length ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-raised)]/50 p-10 text-center">
            <p className="text-sm text-[var(--muted)]">Nenhum objetivo cadastrado ainda.</p>
            <p className="mt-1 text-xs text-[var(--muted-light)]">Ex.: Reserva, Casamento, Imóvel, Carro…</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {objectives.map((o) => (
              <ObjectiveCard
                key={o.id}
                objective={o}
                currentMonth={currentMonth}
                onEdit={() => openEdit(o)}
                onDelete={() => remove(o)}
              />
            ))}
          </div>
        )}
      </div>

      {dialogOpen && (
        <ObjectiveDialog
          initial={editing}
          onClose={() => { setDialogOpen(false); setEditing(null); }}
          onSubmit={save}
        />
      )}
    </>
  );
}

function ObjectiveCard({
  objective: o,
  currentMonth,
  onEdit,
  onDelete,
}: {
  objective: ObjectiveRecord;
  currentMonth: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const done = completionMonth(o, currentMonth);
  const progress = o.targetValue > 0 ? Math.min(100, (o.initialValue / o.targetValue) * 100) : 0;

  const rows: [string, string][] = [
    ["Valor atual", formatCurrencyBRL(o.initialValue)],
    ["Aporte mensal", formatCurrencyBRL(o.monthlyContribution)],
    ["Taxa", `${o.monthlyRate.toLocaleString("pt-BR", { maximumFractionDigits: 4 })}% a.m.`],
  ];

  return (
    <div className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-[var(--foreground)]">{o.name}</h3>
          <p className="text-xs text-[var(--muted)]">Alvo {formatCurrencyBRL(o.targetValue)}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" size="xs" onClick={onEdit} title="Editar">
            <Pencil className="h-3.5 w-3.5" aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={onDelete}
            title="Excluir"
            className="text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-raised)] border border-[var(--border)]">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-[var(--muted)]">
          {progress.toFixed(0)}% do alvo
        </p>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-[var(--muted)]">{label}</dt>
            <dd className="font-semibold text-[var(--foreground)]">{value}</dd>
          </div>
        ))}
      </dl>

      <div
        className={`mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 ${
          done
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
            : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
        }`}
      >
        <CalendarCheck className="h-5 w-5 shrink-0" aria-hidden />
        {done ? (
          <div>
            <p className="text-xs">Conclusão prevista</p>
            <p className="text-sm font-bold">
              {monthLabel(done.month)} <span className="font-normal">· {durationLabel(done.months)}</span>
            </p>
          </div>
        ) : (
          <p className="text-sm font-semibold">Com esses parâmetros o objetivo não é atingido.</p>
        )}
      </div>
    </div>
  );
}

function ObjectiveDialog({
  initial,
  onClose,
  onSubmit,
}: {
  initial: ObjectiveRecord | null;
  onClose: () => void;
  onSubmit: (o: ObjectiveRecord) => Promise<void>;
}) {
  const centsText = (v: number) => {
    const c = Math.round(v * 100);
    return c ? formatBRLFromCents(c) : "";
  };
  const [id] = React.useState(() => initial?.id ?? newId());
  const [name, setName] = React.useState(initial?.name ?? "");
  const [initialText, setInitialText] = React.useState(centsText(initial?.initialValue ?? 0));
  const [targetText, setTargetText] = React.useState(centsText(initial?.targetValue ?? 0));
  const [contributionText, setContributionText] = React.useState(centsText(initial?.monthlyContribution ?? 0));
  const [rate, setRate] = React.useState(initial ? String(initial.monthlyRate).replace(".", ",") : "");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape" && !submitting) onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, submitting]);

  const draft: ObjectiveRecord = {
    id,
    name: name.trim(),
    initialValue: parseBRLCents(initialText) / 100,
    targetValue: parseBRLCents(targetText) / 100,
    monthlyContribution: parseBRLCents(contributionText) / 100,
    monthlyRate: Number(rate.replace(",", ".")) || 0,
    createdAt: initial?.createdAt ?? 0, // definido pelo banco
  };
  const currentMonth = todayAsDateInputValue().slice(0, 7);
  const preview = draft.targetValue > 0 ? completionMonth(draft, currentMonth) : undefined;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (!draft.name) return setError("Digite um nome.");
    if (draft.targetValue <= 0) return setError("O valor alvo precisa ser maior que zero.");
    if (draft.monthlyRate < 0 || draft.monthlyRate > 100) return setError("Taxa inválida.");

    try {
      setSubmitting(true);
      await onSubmit(draft);
      onClose();
    } catch (err) {
      console.error(err);
      setSubmitting(false);
      setError("Não foi possível salvar agora. Tente novamente.");
    }
  }

  const inputClass =
    "w-full h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm " +
    "text-[var(--foreground)] placeholder:text-[var(--muted-light)] outline-none " +
    "focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-all";

  const moneyField = (label: string, value: string, set: (v: string) => void) => (
    <div className="grid gap-1.5">
      <label className="text-sm font-semibold text-[var(--foreground)]">{label}</label>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          const cents = parseBRLCents(e.target.value);
          set(cents === 0 ? "" : formatBRLFromCents(cents));
        }}
        placeholder="R$ 0,00"
        className={inputClass}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-0 sm:p-4" role="dialog" aria-modal>
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-black/50 cursor-pointer"
        onClick={() => { if (!submitting) onClose(); }}
      />

      <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-lg animate-slide-up sm:animate-scale-in">
        <div className="flex justify-center pt-3 pb-0 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-[var(--border)]" />
        </div>

        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
              <TrendingUp className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--foreground)]">{initial ? "Editar objetivo" : "Novo objetivo"}</h3>
              <p className="text-xs text-[var(--muted)]">A conclusão é calculada automaticamente</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="cursor-pointer h-8 w-8 flex items-center justify-center rounded-xl text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-raised)] transition-colors"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <fieldset disabled={submitting} className="grid gap-4">
            <div className="grid gap-1.5">
              <label className="text-sm font-semibold text-[var(--foreground)]">Nome</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Reserva de emergência"
                className={inputClass}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {moneyField("Valor atual", initialText, setInitialText)}
              {moneyField("Valor alvo", targetText, setTargetText)}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {moneyField("Aporte mensal", contributionText, setContributionText)}
              <div className="grid gap-1.5">
                <label className="text-sm font-semibold text-[var(--foreground)]">Taxa (% a.m.)</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={rate}
                    onChange={(e) => setRate(e.target.value.replace(/[^\d,.]/g, ""))}
                    placeholder="0,8"
                    className={`${inputClass} pr-8`}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)]">%</span>
                </div>
              </div>
            </div>
          </fieldset>

          {preview !== undefined && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2.5">
              <CalendarCheck className="h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden />
              <p className="text-sm text-[var(--foreground)]">
                {preview
                  ? <>Conclusão prevista: <strong>{monthLabel(preview.month)}</strong> ({durationLabel(preview.months)})</>
                  : "Com esses parâmetros o objetivo não é atingido."}
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 px-3 py-2.5">
              <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
              <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
            </div>
          )}

          <div className="mt-5 flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>Cancelar</Button>
            <Button type="submit" loading={submitting}>{initial ? "Salvar" : "Cadastrar"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
