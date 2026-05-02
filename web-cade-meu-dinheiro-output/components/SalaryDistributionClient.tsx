"use client";

import * as React from "react";
import { Button } from "./Button";
import { formatCurrencyBRL, parseBRLCents, formatBRLFromCents } from "../lib/finance/format";
import { todayAsDateInputValue } from "../lib/finance";
import {
  fetchSalarySettings,
  upsertSalarySettings,
  fetchSalaryCategories,
  fetchSalaryItems,
  createSalaryCategory,
  deleteSalaryCategory,
  createSalaryItem,
  updateSalaryItem,
  deleteSalaryItem,
  type SalarySettings,
  type SalaryCategory,
  type SalaryItem,
} from "../lib/supabase/queries/salaryDistribution";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function useCurrencyInput(initial: number) {
  const [cents, setCents] = React.useState(() => Math.round(initial * 100));
  const [raw, setRaw] = React.useState(() => (initial > 0 ? formatBRLFromCents(Math.round(initial * 100)) : ""));

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    const c = parseBRLCents(v);
    setCents(c);
    setRaw(formatBRLFromCents(c));
  }

  function setValue(value: number) {
    const c = Math.round(value * 100);
    setCents(c);
    setRaw(value > 0 ? formatBRLFromCents(c) : "");
  }

  return { raw, handleChange, valueFloat: cents / 100, setValue };
}

// ---------------------------------------------------------------------------
// Modal para adicionar alocação / item dentro de categoria
// ---------------------------------------------------------------------------

type ModalProps = {
  mode: "new-category" | "add-item";
  categoryName?: string; // pré-preenchido quando mode === "add-item"
  onConfirm: (category: string, description: string, value: number) => void;
  onClose: () => void;
};

function AllocationModal({ mode, categoryName, onConfirm, onClose }: ModalProps) {
  const [category, setCategory] = React.useState(categoryName ?? "");
  const currency = useCurrencyInput(0);
  const [description, setDescription] = React.useState("");
  const [error, setError] = React.useState("");

  function handleSubmit() {
    if (mode === "new-category" && !category.trim()) {
      setError("Informe o nome da categoria.");
      return;
    }
    if (!description.trim()) {
      setError("Informe a descrição.");
      return;
    }
    if (currency.valueFloat <= 0) {
      setError("Informe um valor maior que zero.");
      return;
    }
    onConfirm(category.trim(), description.trim(), currency.valueFloat);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 shadow-xl p-6 space-y-4">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {mode === "new-category" ? "Nova alocação" : `Adicionar em "${categoryName}"`}
        </h3>

        {mode === "new-category" && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Categoria</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ex: Moradia, Educação…"
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0b2a5b]/40"
            />
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Descrição</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Aluguel, Curso de inglês…"
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0b2a5b]/40"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Valor</label>
          <input
            type="text"
            inputMode="numeric"
            value={currency.raw}
            onChange={currency.handleChange}
            placeholder="R$ 0,00"
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0b2a5b]/40"
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex gap-2 pt-1">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" className="flex-1" onClick={handleSubmit}>
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Currency field inline-editable
// ---------------------------------------------------------------------------

type InlineCurrencyProps = {
  value: number;
  onChange: (next: number) => void;
  label?: string;
  autoCalcLabel?: string;
};

function InlineCurrencyField({ value, onChange, autoCalcLabel }: InlineCurrencyProps) {
  const [editing, setEditing] = React.useState(false);
  const [raw, setRaw] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  function startEdit() {
    setRaw(value > 0 ? formatBRLFromCents(Math.round(value * 100)) : "");
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function commit() {
    const cents = parseBRLCents(raw);
    onChange(cents / 100);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={raw}
        onChange={(e) => setRaw(formatBRLFromCents(parseBRLCents(e.target.value)))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-36 rounded-lg border border-[#0b2a5b]/40 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 text-sm text-right text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0b2a5b]/40"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      className="group flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      title="Clique para editar"
    >
      {autoCalcLabel && (
        <span className="text-xs text-zinc-400 dark:text-zinc-500">{autoCalcLabel}</span>
      )}
      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {formatCurrencyBRL(value)}
      </span>
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Category section
// ---------------------------------------------------------------------------

type CategorySectionProps = {
  category: SalaryCategory;
  items: SalaryItem[];
  onAddItem: (categoryId: string, categoryName: string) => void;
  onUpdateItem: (itemId: string, value: number) => void;
  onDeleteItem: (itemId: string) => void;
  onDeleteCategory: (categoryId: string, name: string) => void;
};

function CategorySection({
  category,
  items,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onDeleteCategory,
}: CategorySectionProps) {
  const total = items.reduce((s, it) => s + it.value, 0);

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{category.name}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Total: <span className="font-medium">{formatCurrencyBRL(total)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onAddItem(category.id, category.name)}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#0b2a5b] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            Adicionar
          </button>
          <button
            type="button"
            onClick={() => onDeleteCategory(category.id, category.name)}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            title="Excluir categoria"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="px-4 py-4 text-sm text-zinc-400 dark:text-zinc-600 text-center italic">
          Nenhum lançamento ainda.
        </div>
      ) : (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
              <span className="text-sm text-zinc-700 dark:text-zinc-300 min-w-0 truncate">
                {item.description}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <InlineCurrencyField
                  value={item.value}
                  onChange={(v) => onUpdateItem(item.id, v)}
                />
                <button
                  type="button"
                  onClick={() => onDeleteItem(item.id)}
                  className="rounded-lg p-1 text-zinc-300 dark:text-zinc-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  title="Excluir item"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SalaryDistributionClient() {
  const [month, setMonth] = React.useState(() => todayAsDateInputValue().slice(0, 7));

  // Settings state
  const [settingsId, setSettingsId] = React.useState<string | undefined>();
  const [hours, setHours] = React.useState(0);
  const hourlyRate = useCurrencyInput(0);
  const commission = useCurrencyInput(0);

  // Despesas PJ
  const accounting = useCurrencyInput(0);
  const inss = useCurrencyInput(0);
  const [simplasOverride, setSimplasOverride] = React.useState<number | null>(null);
  const simplesField = useCurrencyInput(0);

  // Categories & items
  const [categories, setCategories] = React.useState<SalaryCategory[]>([]);
  const [items, setItems] = React.useState<SalaryItem[]>([]);

  // Modal
  const [modal, setModal] = React.useState<{
    mode: "new-category" | "add-item";
    categoryId?: string;
    categoryName?: string;
  } | null>(null);

  // Loading & saving
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const saveTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  const totalRevenue = hours * hourlyRate.valueFloat + commission.valueFloat;
  const simplesValue = simplasOverride !== null ? simplasOverride : totalRevenue * 0.06;

  const allDistributedValues: number[] = [
    accounting.valueFloat,
    simplesValue,
    inss.valueFloat,
    ...items.map((it) => it.value),
  ];

  const totalDistributed = allDistributedValues.reduce((s, v) => s + v, 0);
  const freeMoney = totalRevenue - totalDistributed;

  // ---------------------------------------------------------------------------
  // Load data when month changes
  // ---------------------------------------------------------------------------

  React.useEffect(() => {
    setLoading(true);

    fetchSalarySettings(month)
      .then((s) => {
        if (s) {
          setSettingsId(s.id);
          setHours(s.hours);
          hourlyRate.setValue(s.hourlyRate);
          commission.setValue(s.commission);
          accounting.setValue(s.accounting);
          inss.setValue(s.inss);
          if (s.simplasOverride !== null) {
            setSimplasOverride(s.simplasOverride);
            simplesField.setValue(s.simplasOverride);
          } else {
            setSimplasOverride(null);
          }
        } else {
          setSettingsId(undefined);
          setHours(0);
          hourlyRate.setValue(0);
          commission.setValue(0);
          accounting.setValue(0);
          inss.setValue(0);
          setSimplasOverride(null);
        }
      })
      .catch(console.error);

    fetchSalaryCategories(month)
      .then(async (cats) => {
        setCategories(cats);
        const allItems = await fetchSalaryItems(cats.map((c) => c.id));
        setItems(allItems);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  // ---------------------------------------------------------------------------
  // Auto-save settings debounced
  // ---------------------------------------------------------------------------

  function scheduleSaveSettings() {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      setSaving(true);
      upsertSalarySettings({
        id: settingsId,
        monthYear: month,
        hours,
        hourlyRate: hourlyRate.valueFloat,
        commission: commission.valueFloat,
        accounting: accounting.valueFloat,
        inss: inss.valueFloat,
        simplasOverride,
      })
        .catch(console.error)
        .finally(() => setSaving(false));
    }, 800);
  }

  // Trigger save whenever any setting changes
  React.useEffect(() => {
    scheduleSaveSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hours,
    hourlyRate.valueFloat,
    commission.valueFloat,
    accounting.valueFloat,
    inss.valueFloat,
    simplasOverride,
    month,
  ]);

  // ---------------------------------------------------------------------------
  // Simples Nacional toggle
  // ---------------------------------------------------------------------------

  function handleSimplesChange(v: number) {
    setSimplasOverride(v);
    simplesField.setValue(v);
  }

  function resetSimplesToAuto() {
    setSimplasOverride(null);
  }

  // ---------------------------------------------------------------------------
  // Modal handlers
  // ---------------------------------------------------------------------------

  async function handleModalConfirm(categoryName: string, description: string, value: number) {
    setModal(null);

    if (modal?.mode === "new-category") {
      // Check if category with same name exists
      let cat = categories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());
      if (!cat) {
        cat = await createSalaryCategory(month, categoryName);
        setCategories((prev) => [...prev, cat!]);
      }
      const item = await createSalaryItem(cat.id, description, value);
      setItems((prev) => [...prev, item]);
    } else if (modal?.mode === "add-item" && modal.categoryId) {
      const item = await createSalaryItem(modal.categoryId, description, value);
      setItems((prev) => [...prev, item]);
    }
  }

  async function handleUpdateItem(itemId: string, value: number) {
    setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, value } : it)));
    await updateSalaryItem(itemId, value);
  }

  async function handleDeleteItem(itemId: string) {
    if (!window.confirm("Excluir este lançamento?")) return;
    setItems((prev) => prev.filter((it) => it.id !== itemId));
    await deleteSalaryItem(itemId);
  }

  async function handleDeleteCategory(categoryId: string, name: string) {
    if (!window.confirm(`Excluir a categoria "${name}" e todos os seus lançamentos?`)) return;
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    setItems((prev) => prev.filter((it) => it.categoryId !== categoryId));
    await deleteSalaryCategory(categoryId);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Month selector + save indicator */}
      <div className="flex items-center justify-between gap-3">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0b2a5b]/40"
        />
        {saving && (
          <span className="text-xs text-zinc-400 dark:text-zinc-500 animate-pulse">Salvando…</span>
        )}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 text-center text-sm text-zinc-400">
          Carregando…
        </div>
      ) : (
        <>
          {/* ------------------------------------------------------------------ */}
          {/* Faturamento */}
          {/* ------------------------------------------------------------------ */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
            <div className="px-4 py-3 bg-[#0b2a5b] dark:bg-[#071b3b]">
              <p className="text-sm font-semibold text-white">Faturamento</p>
            </div>

            <div className="p-4 space-y-3">
              {/* Horas */}
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm text-zinc-600 dark:text-zinc-400">Horas trabalhadas</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={hours === 0 ? "" : hours}
                  onChange={(e) => setHours(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-28 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 text-sm text-right text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0b2a5b]/40"
                />
              </div>

              {/* Valor hora */}
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm text-zinc-600 dark:text-zinc-400">Valor da hora</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={hourlyRate.raw}
                  onChange={hourlyRate.handleChange}
                  placeholder="R$ 0,00"
                  className="w-36 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 text-sm text-right text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0b2a5b]/40"
                />
              </div>

              {/* Comissão */}
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm text-zinc-600 dark:text-zinc-400">Comissão</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={commission.raw}
                  onChange={commission.handleChange}
                  placeholder="R$ 0,00"
                  className="w-36 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 text-sm text-right text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0b2a5b]/40"
                />
              </div>

              {/* Total */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Total do faturamento
                </span>
                <span className="text-base font-bold text-[#0b2a5b] dark:text-blue-400">
                  {formatCurrencyBRL(totalRevenue)}
                </span>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------------ */}
          {/* Despesas PJ — categoria fixa */}
          {/* ------------------------------------------------------------------ */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
            <div className="px-4 py-3 bg-zinc-700 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
              <p className="text-sm font-semibold text-white">Despesas PJ</p>
              <p className="text-xs text-zinc-300 dark:text-zinc-400">
                Total: <span className="font-medium">{formatCurrencyBRL(accounting.valueFloat + simplesValue + inss.valueFloat)}</span>
              </p>
            </div>

            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {/* Contabilidade */}
              <li className="flex items-center justify-between gap-2 px-4 py-3">
                <span className="text-sm text-zinc-700 dark:text-zinc-300">Contabilidade</span>
                <InlineCurrencyField
                  value={accounting.valueFloat}
                  onChange={(v) => accounting.setValue(v)}
                />
              </li>

              {/* Simples Nacional */}
              <li className="flex items-center justify-between gap-2 px-4 py-3">
                <span className="text-sm text-zinc-700 dark:text-zinc-300">Simples Nacional</span>
                <div className="flex items-center gap-2">
                  {simplasOverride === null ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-zinc-400 dark:text-zinc-500">(6% automático)</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSimplasOverride(simplesValue);
                          simplesField.setValue(simplesValue);
                        }}
                        className="text-xs text-blue-500 hover:underline"
                      >
                        editar
                      </button>
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 ml-1">
                        {formatCurrencyBRL(simplesValue)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={resetSimplesToAuto}
                        className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                        title="Voltar para cálculo automático"
                      >
                        ↺
                      </button>
                      <InlineCurrencyField
                        value={simplasOverride}
                        onChange={handleSimplesChange}
                      />
                    </div>
                  )}
                </div>
              </li>

              {/* INSS */}
              <li className="flex items-center justify-between gap-2 px-4 py-3">
                <span className="text-sm text-zinc-700 dark:text-zinc-300">INSS</span>
                <InlineCurrencyField
                  value={inss.valueFloat}
                  onChange={(v) => inss.setValue(v)}
                />
              </li>
            </ul>
          </div>

          {/* ------------------------------------------------------------------ */}
          {/* Categorias do usuário */}
          {/* ------------------------------------------------------------------ */}
          {categories.map((cat) => (
            <CategorySection
              key={cat.id}
              category={cat}
              items={items.filter((it) => it.categoryId === cat.id)}
              onAddItem={(catId, catName) =>
                setModal({ mode: "add-item", categoryId: catId, categoryName: catName })
              }
              onUpdateItem={handleUpdateItem}
              onDeleteItem={handleDeleteItem}
              onDeleteCategory={handleDeleteCategory}
            />
          ))}

          {/* ------------------------------------------------------------------ */}
          {/* Botão adicionar alocação */}
          {/* ------------------------------------------------------------------ */}
          <Button
            variant="secondary"
            className="w-full gap-2"
            onClick={() => setModal({ mode: "new-category" })}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            Adicionar alocação
          </Button>

          {/* ------------------------------------------------------------------ */}
          {/* Gasto livre */}
          {/* ------------------------------------------------------------------ */}
          <div className={`rounded-2xl border p-4 flex items-center justify-between gap-2 ${
            freeMoney >= 0
              ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/20"
              : "border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20"
          }`}>
            <div>
              <p className={`text-sm font-semibold ${freeMoney >= 0 ? "text-emerald-800 dark:text-emerald-300" : "text-red-700 dark:text-red-400"}`}>
                Gasto livre
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Faturamento − todas as alocações
              </p>
            </div>
            <span className={`text-xl font-bold ${freeMoney >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
              {formatCurrencyBRL(freeMoney)}
            </span>
          </div>
        </>
      )}

      {/* Modal */}
      {modal && (
        <AllocationModal
          mode={modal.mode}
          categoryName={modal.categoryName}
          onConfirm={handleModalConfirm}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
