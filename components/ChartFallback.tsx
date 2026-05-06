export function ChartFallback() {
  return (
    <div className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-500">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-200 border-t-green-500" />
      Carregando gráfico...
    </div>
  );
}
