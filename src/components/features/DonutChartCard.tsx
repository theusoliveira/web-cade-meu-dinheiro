"use client";

import * as React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { formatCurrencyBRL } from "@/lib/finance";

export type DonutSlice = { name: string; value: number };

export type DonutChartCardProps = {
  title: string;
  data: DonutSlice[];
  colors: string[];
  centerLabel?: string;
};

function percent(value: number, total: number): string {
  if (total <= 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

export function DonutChartCard({ title, data, colors, centerLabel }: DonutChartCardProps) {
  const total = React.useMemo(() => data.reduce((acc, d) => acc + d.value, 0), [data]);
  const sortedData = React.useMemo(() => [...data].sort((a, b) => b.value - a.value), [data]);
  const hasData = total > 0;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-sm font-semibold text-[var(--foreground)] truncate">{title}</h3>
        <span className="shrink-0 text-xs font-mono font-bold text-[var(--muted)]">{formatCurrencyBRL(total)}</span>
      </div>

      {hasData ? (
        <div className="grid gap-4">
          <div className="relative h-40 w-full">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="62%"
                  outerRadius="88%"
                  paddingAngle={2}
                  isAnimationActive={false}
                >
                  {data.map((_, idx) => (
                    <Cell key={idx} fill={colors[idx % colors.length]} stroke="transparent" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="text-center">
                <p className="text-sm font-bold font-mono text-[var(--foreground)]">{formatCurrencyBRL(total)}</p>
                {centerLabel && <p className="mt-0.5 text-[10px] text-[var(--muted)]">{centerLabel}</p>}
              </div>
            </div>
          </div>

          <div className="grid gap-1.5">
            {sortedData.slice(0, 5).map((d, idx) => (
              <div key={d.name} className="flex items-center justify-between gap-2 text-xs">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: colors[idx % colors.length] }}
                    aria-hidden
                  />
                  <span className="truncate text-[var(--muted)]">{d.name}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[var(--muted-light)]">{percent(d.value, total)}</span>
                  <span className="font-semibold font-mono text-[var(--foreground)]">{formatCurrencyBRL(d.value)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-raised)]/50 p-6 text-center">
          <p className="text-xs text-[var(--muted)]">Sem dados no mês selecionado.</p>
        </div>
      )}
    </div>
  );
}

export function ChartFallback() {
  return <div className="skeleton h-[204px] rounded-2xl" />;
}
