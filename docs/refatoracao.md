# Refatoracao arquitetural

Este documento registra a direcao da refatoracao incremental do projeto.

## Objetivos

- Reduzir responsabilidades do `HomeClient`.
- Centralizar transformacoes de dados vindos do Supabase.
- Separar regras reutilizaveis em `lib` e, quando fizer sentido, em hooks.
- Manter o comportamento atual da aplicacao durante a refatoracao.

## Diretrizes

- Preferir PRs pequenos e revisaveis.
- Evitar reescritas grandes sem cobertura de teste.
- Extrair primeiro codigo puro: datas, mapeadores, formatadores e ordenacao.
- Depois extrair hooks e services.
- Evitar alterar UI e regra de negocio no mesmo commit de refatoracao.

## Proximas extracoes recomendadas

1. `useProfile`: carregamento do perfil do usuario.
2. `useEntries`: carregamento e mutacoes de lancamentos mensais.
3. `useFixedEntries`: templates de lancamentos fixos.
4. `useCardEntries`: controle de gastos.
5. `financeRepository`: camada fina para chamadas Supabase.
