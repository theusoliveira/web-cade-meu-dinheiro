# Cadê Meu Dinheiro?

Controle financeiro inteligente para finanças pessoais e PJ.

## Stack

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **Neon** (PostgreSQL serverless)
- **NextAuth v5** (autenticação com credentials)
- **Recharts** (gráficos)

## Estrutura

```
src/
├── app/               # Rotas (App Router)
│   ├── api/auth/      # NextAuth + registro
│   └── layout.tsx
├── actions/           # Server Actions por domínio
│   ├── entries.ts
│   ├── cardEntries.ts
│   ├── goals.ts
│   ├── profile.ts
│   └── salaryDistribution.ts
├── components/
│   ├── features/      # Componentes de domínio
│   ├── layout/        # Nav, sidebar, etc.
│   └── ui/            # Componentes genéricos (Button, Input, Card)
├── hooks/             # Custom hooks (client-side)
├── lib/
│   ├── db/            # Cliente Neon + mappers
│   └── finance/       # Lógica de negócio (sem JSX)
└── types/
```

## Setup

1. Crie um banco no [Neon](https://neon.tech)
2. Execute o schema em `neon/schema.sql`
3. Execute as migrações em `neon/migrations/`
4. Copie `.env.local.example` para `.env.local` e preencha
5. `npm install && npm run dev`

## Variáveis de ambiente

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```
