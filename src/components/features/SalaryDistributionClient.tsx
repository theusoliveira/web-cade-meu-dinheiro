"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { useSalaryDistribution } from "@/hooks/useSalaryDistribution";
import { formatCurrencyBRL, formatBRLFromCents } from "@/lib/finance/format";

// ─── Currency input helpers ───────────────────────────────────────────────────

function toCentsDisplay(value: number): string {
  return formatBRLFromCents(Math.round(value * 100));
}

function useCurrencyInput(initial: number, onCommit: (v: number) => void) {
  const [raw, setRaw] = React.useState(() => toCentsDisplay(initial));
  const [cents, setCents] = React.useState(() => Math.round(initial * 100));

  React.useEffect(() => {
    setRaw(toCentsDisplay(initial));
    setCents(Math.round(initial * 100));
  }, [initial]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "");
    const c = digits ? parseInt(digits, 10) : 0;
    setCents(c);
    setRaw(formatBRLFromCents(c));
  }

  function handleBlur() {
    onCommit(cents / 100);
  }

  return { value: raw, onChange: handleChange, onBlur: handleBlur };
}

// ─── Inline editable money cell ───────────────────────────────────────────────

function EditableMoneyCell({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [raw, setRaw] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  function startEdit() {
    setRaw(String(Math.round(value * 100)));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function commit() {
    const digits = raw.replace(/\D/g, "");
    onChange(digits ? parseInt(digits, 10) / 100 : 0);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-right text-sm dark:border-zinc-600 dark:bg-zinc-800"
        value={formatBRLFromCents(parseInt(raw || "0", 10))}
        onChange={(e) => setRaw(e.target.value.replace(/\D/g, ""))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        autoFocus
      />
    );
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      className="w-full cursor-text rounded px-2 py-1 text-right text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
      title="Clique para editar"
    >
      {formatCurrencyBRL(value)}
    </button>
  );
}

// ─── Inline editable text cell ────────────────────────────────────────────────

function EditableTextCell({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);

  function commit() {
    if (draft.trim()) onChange(draft.trim());
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800"
        value={draft}
        autoFocus
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => { setDraft(value); setEditing(true); }}
      className="w-full cursor-text rounded px-2 py-1 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
      title="Clique para editar"
    >
      {value}
    </button>
  );
}

// ─── Confirm delete modal ─────────────────────────────────────────────────────

function ConfirmDeleteModal({
  categoryName,
  onCancel,
  onConfirm,
}: {
  categoryName: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" aria-hidden>
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="mt-3 text-base font-semibold">Excluir categoria</h2>
        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          Tem certeza que deseja excluir{" "}
          <span className="font-medium text-zinc-700 dark:text-zinc-200">"{categoryName}"</span>?
          Todos os itens desta categoria também serão removidos. Esta ação não pode ser desfeita.
        </p>
        <div className="mt-6 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:text-white dark:hover:bg-red-700"
            onClick={onConfirm}
          >
            Excluir
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Allocation Modal (new category + first item) ─────────────────────────

function AddCategoryModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (category: string, description: string, value: number) => void;
}) {
  const [category, setCategory] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [cents, setCents] = React.useState(0);

  function handleMoneyChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "");
    setCents(digits ? parseInt(digits, 10) : 0);
  }

  function submit() {
    if (!category.trim() || !description.trim()) return;
    onSave(category.trim(), description.trim(), cents / 100);
  }

  const inputBase =
    "w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:focus:border-zinc-500";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        <h2 className="mb-4 text-base font-semibold">Adicionar alocação</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Categoria
            </label>
            <input
              autoFocus
              className={inputBase}
              placeholder="Ex: Moradia, Transporte…"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Descrição
            </label>
            <input
              className={inputBase}
              placeholder="Ex: Aluguel, Gasolina…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Valor
            </label>
            <input
              className={inputBase + " text-right"}
              value={formatBRLFromCents(cents)}
              onChange={handleMoneyChange}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              inputMode="numeric"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="flex-1"
            onClick={submit}
            disabled={!category.trim() || !description.trim()}
          >
            Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Item Modal ────────────────────────────────────────────────────────────

function AddItemModal({
  categoryName,
  onClose,
  onSave,
}: {
  categoryName: string;
  onClose: () => void;
  onSave: (description: string, value: number) => void;
}) {
  const [description, setDescription] = React.useState("");
  const [cents, setCents] = React.useState(0);

  function handleMoneyChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "");
    setCents(digits ? parseInt(digits, 10) : 0);
  }

  function submit() {
    if (!description.trim()) return;
    onSave(description.trim(), cents / 100);
  }

  const inputBase =
    "w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:focus:border-zinc-500";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        <h2 className="mb-1 text-base font-semibold">Adicionar item</h2>
        <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">{categoryName}</p>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Descrição
            </label>
            <input
              autoFocus
              className={inputBase}
              placeholder="Ex: Aluguel, Gasolina…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Valor
            </label>
            <input
              className={inputBase + " text-right"}
              value={formatBRLFromCents(cents)}
              onChange={handleMoneyChange}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              inputMode="numeric"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={submit} disabled={!description.trim()}>
            Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SalaryDistributionClient() {
  const [addCategoryOpen, setAddCategoryOpen] = React.useState(false);
  const [addItemTarget, setAddItemTarget] = React.useState<{ id: string; name: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name: string } | null>(null);

  const {
    billing,
    categories,
    loading,
    saveBilling,
    saveItemValue,
    saveItemDescription,
    addCategory,
    addItemToCategory,
    removeItem,
    removeCategory,
  } = useSalaryDistribution();

  // ── Billing state ──────────────────────────────────────────────────────────

  const [localHours, setLocalHours] = React.useState(0);
  const [localHourlyRate, setLocalHourlyRate] = React.useState(0);
  const [localCommission, setLocalCommission] = React.useState(0);

  React.useEffect(() => {
    if (billing) {
      setLocalHours(billing.hours);
      setLocalHourlyRate(billing.hourlyRate);
      setLocalCommission(billing.commission);
    }
  }, [billing]);

  const faturamento = localHours * localHourlyRate + localCommission;
  const simplesAuto = billing?.simplesAuto ?? true;

  // ── Simples Nacional ───────────────────────────────────────────────────────

  const simplesItem = React.useMemo(() => {
    for (const cat of categories) {
      if (cat.isFixed) {
        const found = cat.items.find((i) => i.itemKey === "simples_nacional");
        if (found) return found;
      }
    }
    return null;
  }, [categories]);

  const simplesValue = simplesAuto ? faturamento * 0.06 : (simplesItem?.value ?? 0);

  React.useEffect(() => {
    if (!simplesAuto || !simplesItem) return;
    const newVal = faturamento * 0.06;
    if (Math.abs(newVal - (simplesItem.value ?? 0)) > 0.001) {
      const fixedCat = categories.find((c) => c.isFixed);
      if (fixedCat) saveItemValue(simplesItem.id, newVal, fixedCat.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faturamento, simplesAuto]);

  // ── Currency inputs ────────────────────────────────────────────────────────

  const hoursOnBlur = () =>
    saveBilling({ hours: localHours, hourlyRate: localHourlyRate, commission: localCommission, simplesAuto });

  const hourlyRateInput = useCurrencyInput(localHourlyRate, (v) => {
    setLocalHourlyRate(v);
    saveBilling({ hours: localHours, hourlyRate: v, commission: localCommission, simplesAuto });
  });

  const commissionInput = useCurrencyInput(localCommission, (v) => {
    setLocalCommission(v);
    saveBilling({ hours: localHours, hourlyRate: localHourlyRate, commission: v, simplesAuto });
  });

  // ── Totals ─────────────────────────────────────────────────────────────────

  const totalAllocated = React.useMemo(
    () =>
      categories.reduce(
        (sum, cat) =>
          sum +
          cat.items.reduce(
            (s, i) => s + (cat.isFixed && i.itemKey === "simples_nacional" ? simplesValue : i.value),
            0,
          ),
        0,
      ),
    [categories, simplesValue],
  );

  const gastoLivre = faturamento - totalAllocated;

  function pct(value: number) {
    if (faturamento <= 0) return "—";
    return `${Math.round((value / faturamento) * 100)}%`;
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function handleAddCategory(catName: string, desc: string, val: number) {
    setAddCategoryOpen(false);
    await addCategory(catName, desc, val);
  }

  async function handleAddItem(desc: string, val: number) {
    if (!addItemTarget) return;
    setAddItemTarget(null);
    await addItemToCategory(addItemTarget.id, desc, val);
  }

  async function handleConfirmDeleteCategory() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    await removeCategory(id);
  }

  async function handleDeleteItem(itemId: string, catId: string, desc: string) {
    if (!window.confirm(`Excluir o item "${desc}"?`)) return;
    await removeItem(itemId, catId);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const inputBase =
    "w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:focus:border-zinc-500";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold">Distribuição de Salário PJ</h1>
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
          Planeje como distribuir o seu faturamento.
        </p>
      </div>

      {loading && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500">Carregando…</p>
      )}

      {/* Billing inputs */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-4 text-sm font-semibold">Faturamento</h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Horas trabalhadas
            </label>
            <input
              type="number"
              min={0}
              step={0.5}
              className={inputBase + " text-right"}
              value={localHours || ""}
              onChange={(e) => setLocalHours(parseFloat(e.target.value.replace(",", ".")) || 0)}
              onBlur={hoursOnBlur}
              placeholder="0"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Valor por hora
            </label>
            <input
              className={inputBase + " text-right"}
              value={hourlyRateInput.value}
              onChange={hourlyRateInput.onChange}
              onBlur={hourlyRateInput.onBlur}
              inputMode="numeric"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Comissão
            </label>
            <input
              className={inputBase + " text-right"}
              value={commissionInput.value}
              onChange={commissionInput.onChange}
              onBlur={commissionInput.onBlur}
              inputMode="numeric"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-900">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Total do faturamento
          </span>
          <span className="text-base font-bold text-zinc-900 dark:text-zinc-50">
            {formatCurrencyBRL(faturamento)}
          </span>
        </div>
      </section>

      {/* Categories */}
      {categories.map((cat) => {
        const catTotal = cat.items.reduce(
          (s, i) => s + (cat.isFixed && i.itemKey === "simples_nacional" ? simplesValue : i.value),
          0,
        );

        return (
          <section
            key={cat.id}
            className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
          >
            {/* Category header */}
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3 dark:border-zinc-800">
              <h2 className="text-sm font-semibold">
                {cat.name}
                {cat.isFixed && (
                  <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    Fixo
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAddItemTarget({ id: cat.id, name: cat.name })}
                  className="h-8 gap-1.5 px-2 text-xs"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Adicionar item
                </Button>

                {!cat.isFixed && (
                  <button
                    type="button"
                    onClick={() => setDeleteTarget({ id: cat.id, name: cat.name })}
                    className="ml-1 rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                    title="Excluir categoria"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
                      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
              {cat.items.length === 0 ? (
                <p className="px-5 py-4 text-xs text-zinc-400 dark:text-zinc-600">
                  Nenhum item ainda.
                </p>
              ) : (
                cat.items.map((item) => {
                  const isSimples = item.itemKey === "simples_nacional";
                  const displayValue = isSimples ? simplesValue : item.value;

                  return (
                    <div key={item.id} className="flex items-center gap-2 px-5 py-2">
                      {/* Description */}
                      <div className="min-w-0 flex-1">
                        {cat.isFixed ? (
                          <span className="px-2 py-1 text-sm text-zinc-700 dark:text-zinc-300">
                            {item.description}
                            {isSimples && simplesAuto && (
                              <span className="ml-2 text-xs text-zinc-400 dark:text-zinc-500">
                                (6% automático)
                              </span>
                            )}
                          </span>
                        ) : (
                          <EditableTextCell
                            value={item.description}
                            onChange={(v) => saveItemDescription(item.id, v, cat.id)}
                          />
                        )}
                      </div>

                      {/* Value */}
                      <div className="w-36 shrink-0">
                        {isSimples ? (
                          <div className="relative">
                            <EditableMoneyCell
                              value={displayValue}
                              onChange={(v) => {
                                const fixedCat = categories.find((c) => c.isFixed)!;
                                saveItemValue(item.id, v, fixedCat.id);
                                saveBilling({
                                  hours: localHours,
                                  hourlyRate: localHourlyRate,
                                  commission: localCommission,
                                  simplesAuto: false,
                                });
                              }}
                            />
                            {!simplesAuto && (
                              <button
                                type="button"
                                title="Voltar ao cálculo automático (6%)"
                                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 p-1 text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400"
                                onClick={() => {
                                  const newVal = faturamento * 0.06;
                                  const fixedCat = categories.find((c) => c.isFixed)!;
                                  saveItemValue(item.id, newVal, fixedCat.id);
                                  saveBilling({
                                    hours: localHours,
                                    hourlyRate: localHourlyRate,
                                    commission: localCommission,
                                    simplesAuto: true,
                                  });
                                }}
                              >
                                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
                                  <path d="M3 12a9 9 0 0 1 9-9 9 9 0 0 1 6.36 2.64L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9 9 0 0 1-6.36-2.64L3 16M3 21v-5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ) : (
                          <EditableMoneyCell
                            value={item.value}
                            onChange={(v) => saveItemValue(item.id, v, cat.id)}
                          />
                        )}
                      </div>

                      {/* Delete — somente categorias customizadas */}
                      {!cat.isFixed ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id, cat.id, item.description)}
                          className="shrink-0 rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                          title="Excluir item"
                        >
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        </button>
                      ) : (
                        <div className="w-7 shrink-0" />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Subtotal + percentual */}
            <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-2.5 dark:border-zinc-800">
              <span className="text-sm text-zinc-400">Subtotal</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-400">{pct(catTotal)}</span>
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  {formatCurrencyBRL(catTotal)}
                </span>
              </div>
            </div>
          </section>
        );
      })}

      {/* Add allocation button */}
      <Button
        variant="secondary"
        className="w-full gap-2"
        onClick={() => setAddCategoryOpen(true)}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        Adicionar alocação
      </Button>

      {/* Gasto livre */}
      <section className="rounded-2xl border-2 border-dashed border-zinc-300 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-950">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Gasto livre</p>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-500">
              Faturamento após todas as alocações
            </p>
          </div>
          <div className="text-right">
            <p className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              {formatCurrencyBRL(gastoLivre)}
            </p>
            <p className="text-xs text-zinc-400">{pct(gastoLivre)}</p>
          </div>
        </div>

        {faturamento > 0 && (
          <div className="mt-4 space-y-1">
            <div className="flex justify-between text-[11px] text-zinc-500">
              <span>Alocado: {formatCurrencyBRL(totalAllocated)}</span>
              <span>{pct(totalAllocated)} do faturamento</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-zinc-900 transition-all dark:bg-zinc-100"
                style={{ width: `${Math.min(100, (totalAllocated / faturamento) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </section>

      {/* Modals */}
      {addCategoryOpen && (
        <AddCategoryModal
          onClose={() => setAddCategoryOpen(false)}
          onSave={handleAddCategory}
        />
      )}

      {addItemTarget && (
        <AddItemModal
          categoryName={addItemTarget.name}
          onClose={() => setAddItemTarget(null)}
          onSave={handleAddItem}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          categoryName={deleteTarget.name}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDeleteCategory}
        />
      )}
    </div>
  );
}