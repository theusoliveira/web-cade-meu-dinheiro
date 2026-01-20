"use client";

import * as React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { formatCurrencyBRL } from "../lib/finance";

export type DonutSlice = {
  name: string;
  value: number;
};

type Props = {
  title: string;
  data: DonutSlice[]; // já agrupado por categoria
  colors: string[];
  centerLabel?: string;
};

function percent(value: number, total: number): string {
  if (total <= 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

export function DonutChartCard({ title, data, colors, centerLabel }: Props) {
  const total = React.useMemo(() => data.reduce((acc, d) => acc + d.value, 0), [data]);
  const hasData = total > 0;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{formatCurrencyBRL(total)}</span>
      </div>

      <div className="mt-3">
        {hasData ? (
          <div className="grid gap-4">
            <div className="relative h-44 w-full">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="65%"
                    outerRadius="90%"
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
                  <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                    {formatCurrencyBRL(total)}
                  </p>
                  {centerLabel ? (
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {centerLabel}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              {data
                .slice()
                .sort((a, b) => b.value - a.value)
                .map((d, idx) => (
                  <div key={d.name} className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: colors[idx % colors.length] }}
                        aria-hidden="true"
                      />
                      <span className="truncate text-zinc-700 dark:text-zinc-200">{d.name}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {percent(d.value, total)}
                      </span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">
                        {formatCurrencyBRL(d.value)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-800 dark:bg-zinc-900/30">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Sem dados no mês selecionado.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
