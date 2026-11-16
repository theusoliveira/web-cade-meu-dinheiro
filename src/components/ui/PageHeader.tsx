import * as React from "react";

type Props = {
  /** Rótulo pequeno em caixa-alta acima do título */
  eyebrow: string;
  title: string;
  description?: React.ReactNode;
  /** Ações (botões) alinhadas à direita no desktop e abaixo do texto no celular */
  actions?: React.ReactNode;
  /** Esconde as ações abaixo do breakpoint md (quando o celular usa o botão flutuante +) */
  actionsDesktopOnly?: boolean;
};

/** Cabeçalho padrão das páginas (exceto o Dashboard). */
export function PageHeader({ eyebrow, title, description, actions, actionsDesktopOnly = false }: Props) {
  return (
    <div className="flex min-w-0 flex-col gap-4 pt-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
          {title}
          <span className="text-[var(--copper)]">.</span>
        </h1>
        {description && <p className="mt-1.5 text-sm text-[var(--muted)]">{description}</p>}
      </div>
      {actions && <div className={`${actionsDesktopOnly ? "hidden md:flex" : "flex"} shrink-0 flex-wrap items-center gap-2`}>{actions}</div>}
    </div>
  );
}
