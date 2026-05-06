# Cadê Meu Dinheiro?

Controle inteligente de finanças pessoais e PJ.

## Setup

1. Instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente:
```bash
cp .env.local.example .env.local
# Edite .env.local com suas chaves do Supabase
```

3. Execute as migrations no Supabase SQL Editor (veja `docs/`)

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## Estrutura

```
src/
├── app/                  # Next.js App Router
├── components/
│   ├── ui/               # Componentes genéricos (Button, Card, Input)
│   ├── features/         # Componentes de domínio (AuthGate, HomeClient...)
│   └── layout/           # Componentes de layout (AppSidebar, BottomNav...)
├── hooks/                # Custom React hooks
├── lib/
│   ├── finance/          # Lógica financeira
│   └── supabase/         # Cliente e queries Supabase
└── types/                # Tipos TypeScript
```

## Queries Supabase Necessárias

Os arquivos em `src/lib/supabase/queries/` precisam ser criados com base
no seu schema do Supabase. Veja o README em `src/lib/supabase/queries/`.
