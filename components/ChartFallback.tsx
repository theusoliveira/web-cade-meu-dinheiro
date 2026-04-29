/** Fallback exibido enquanto o gráfico (carregado via dynamic import) não está pronto. */
export function ChartFallback() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
      Carregando gráfico...
    </div>
  );
}
