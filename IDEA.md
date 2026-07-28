# Sexta-feira — Estado do Projeto (consolidado até "Arrumar layout mobile", em andamento)

> Este documento substitui a necessidade de ler os 11 chats separadamente. Cole isso no início de um chat novo para retomar o projeto com contexto completo.

---

## 1. O que é o projeto

PWA de produtividade pessoal chamado **Sexta-feira**. Módulos: Home, Tarefas, Notas, Protocolo de treino, Dieta (guia + cardápios gerados), Nutrição (log com base TACO), Físico (peso/sono/checklist), Calculadora TDEE, Configurações (5 temas).

Nasceu como um único `index.html` monolítico (HTML/CSS/JS puro + Supabase), cresceu até ~3000 linhas e foi **migrado por completo para Next.js 14 (App Router) + TypeScript + Tailwind + Supabase (`@supabase/ssr`)**, deployado na Vercel. O `index.html` legado hoje é só relíquia histórica — não é mais tocado.

---

## 2. Stack e arquitetura atuais

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind · Supabase (`@supabase/ssr`) · Deploy na Vercel (push em `main` = deploy automático).

**Supabase — 10 tabelas com RLS:** `profiles`, `protocolo`, `cardapios`, `notas`, `materias`, `tarefas_livres`, `nut_log`, `water_log`, `fisico_log`, `historico_fases`. Mais `active_sessions` (sessão única por conta, heartbeat 1min, expira em 5min sem heartbeat) — **ainda com race condition não resolvida**, não migrado/validado de verdade desde o `index.html`.

**Estrutura de pastas:**
```
src/
  middleware.ts                  ← renova sessão em toda requisição
  lib/
    supabase/{client,server}.ts  ← client = browser (saves em actions), server = SSR (loads em pages)
    types/index.ts
    db/{profile,content,fitness}.ts, index.ts (barrel)
    foodDatabase.ts, cardapioGerador.ts   ← motor de geração de cardápio (TACO)
  components/layout/{AppShell,Sidebar}.tsx
  app/
    layout.tsx, page.tsx (→ /home), globals.css (variáveis dos 5 temas)
    auth/{page,AuthForm,actions}.tsx
    (app)/
      layout.tsx                 ← valida sessão no server, monta AppShell
      home/ tarefas/ notas/ protocolo/ dieta/ nutricao/ fisico/ calculadora/ config/
        cada um: page.tsx (Server Component) + *Client.tsx ('use client') + actions.ts ('use server')
```

**Regra de ouro da arquitetura:** `page.tsx` busca dados no servidor e passa como props → `*Client.tsx` recebe props, guarda estado local otimista, chama `actions.ts` → `actions.ts` faz a query direto no Supabase e `revalidatePath()`. `lib/db/*` é usado pelos loads; saves passam pelas actions diretamente (evita bug de client-no-servidor).

**⚠️ Armadilha conhecida do ambiente de sandbox:** o diretório de trabalho é **plano** (`/mnt/project/`) — arquivos com nome repetido entre rotas (`page.tsx`, `actions.ts`) colidem e só o último upload sobrevive. Arquivos com nome único (`DietaClient.tsx`, `HomeClient.tsx` etc.) são confiáveis; `page.tsx`/`actions.ts` de uma rota específica **não** são, a menos que você cole o conteúdo real na conversa.

---

## 3. Como eu devo agir com este projeto

- **Tom JARVIS** — elegante, direto, levemente sarcástico quando cabe.
- **Nunca reescrever um arquivo sem confirmar o conteúdo real primeiro** — já causei um bug (`DietaClient.tsx` sobrescrito com a versão errada porque assumi de memória qual era a atual). Ler o arquivo do projeto ou pedir pra você colar, sempre, antes de tocar em algo que já existe.
- **Entregar apenas os arquivos alterados**, com o caminho exato de destino (ex: `src/app/(app)/dieta/page.tsx`) — nunca o zip inteiro, a menos que você peça.
- **Validar antes de entregar:** balanceamento de chaves, diff contra o original, e avisar quando não dá pra rodar `tsc --noEmit` de verdade (falta `node_modules` no sandbox) — nesse caso, pedir pra você confirmar o build no seu ambiente.
- **Explicar o que mudou e por quê**, nunca só entregar o arquivo em silêncio.
- **Indicar sempre o próximo passo** depois de qualquer entrega.
- **Não travar em "deixa eu confirmar" sem necessidade** — se o dado já está acessível (arquivo no diretório do projeto), ler direto em vez de perguntar.

## 4. Como você trabalha (pra eu me adaptar)

- Você **não mexe em código** — eu entrego os arquivos prontos com o caminho de destino, e você mesmo cola/substitui manualmente.
- Prefere que eu **use a sequência mais lógica** quando dou liberdade de execução ("continua", "siga"), sem precisar aprovar cada micro-passo.
- Pede resumos de fechamento de chat no formato fixo, **máximo 6 linhas**, sem floreio:
  ```
  ### Sexta-feira — DD/MM/AAAA HH:MM
  STATUS: ...
  FEITO: ...
  PRÓXIMO: ...
  PENDÊNCIA: ...
  ```
- Guarda esses blocos em `contextos_export.txt` no diretório do projeto, agora **com data e hora no topo de cada bloco**, na ordem em que são escritos (combinamos isso depois de um episódio de blocos fora de ordem).
- Quando pede um roadmap/priorização, quer três categorias: 🔴 Erro, 🟡 Básico, 🟢 Novo, com estimativa de quantos chats cada bloco consome.

---

## 5. Linha do tempo (resumida)

| Fase | O quê |
|---|---|
| Origem | `index.html` monolítico, PWA single-file, Supabase auth+dados, ~3000 linhas |
| Bugs de sync | Vários chats resolvendo persistência de dados entre sessões/dispositivos (arquitetura local-first identificada como causa raiz, depois arquitetura de 10 tabelas + `dbSave*/dbLoad*` + sessão única) |
| Decisão de migração | HTML de 3k linhas virou "arquitetura por acidente" — decidido migrar pra Next.js 14 + TS + Tailwind + Vercel |
| Migração base | Auth + Sidebar + Home + Tarefas + Notas + Protocolo migrados e funcionando na Vercel |
| Migração completa | Todos os módulos entregues (Dieta, Nutrição, Físico, Calculadora, Configurações); base TACO criada |
| Motor de cardápio (19/07/2026) | Gerador de cardápio via TACO (570 combinações validadas), aba "Meus Cardápios" na Dieta |
| Roadmap definido | 19 pendências organizadas em prioridade + ~11 blocos de chat |
| Chat 1 (concluído) | Bug de cálculo na Nutrição (escala duplicada, não era só float) + bug de virada de data (UTC vs local) — corrigidos |
| **Chat 2 (EM ANDAMENTO — onde você está agora)** | Mobile responsivo |

---

## 6. Onde você parou exatamente agora

**Chat 2 do roadmap — mobile responsivo**, dividido em 3 blocos:

1. ✅ **Sidebar + AppShell** — vira drawer off-canvas abaixo de 768px, com hambúrguer. Concluído.
2. ✅ **Grids responsivos** — Home, Protocolo (semana de 7 colunas → 2/3/7 conforme tela), Dieta (scroll horizontal nas tabelas de troca), Nutrição (preview de macros 4→2×2). Calculadora não precisou de ajuste. Concluído.
3. ⏳ **Modais e drawers** — ainda não começado. Hoje todo modal é card centralizado de largura fixa (`460px`/`600px`); o padrão do legado era bottom-sheet full-width no mobile. Falta decidir/aplicar esse padrão em Tarefas, Notas, Protocolo, Nutrição.

**No meio do bloco 2, dois bugs foram descobertos e corrigidos** (ambos no `DietaClient.tsx`/`dieta/page.tsx`):
- Eu sobrescrevi o `DietaClient.tsx` com a versão errada (guia estático em vez de gestão de cardápios) — corrigido lendo o arquivo real do projeto.
- `page.tsx` passava uma prop morta (`hiddenCards`) em vez de `profile` — corrigido.
- Bug pré-existente no seu código revelado por isso: `actionSaveRefeicao` era chamada com 3 argumentos, mas a assinatura real pede 2 — corrigido.

**Pendências imediatas antes de continuar:**
1. Confirmar que os arquivos entregues (zip, por causa dos parênteses em `(app)` que quebram `cp` sem aspas) instalaram sem erro.
2. Rodar `npm run build` local e confirmar zero erro de TypeScript.
3. Depois disso: bloco 3 (modais/drawers) fecha o Chat 2.

---

## 7. Backlog pendente (fora do que já está em andamento)

- Seletor de tema: falta aplicar `data-theme` no servidor a partir de `profile.tema` antes do render (hoje há flash do tema errado ao carregar).
- Sistema de sessão única (`active_sessions`) — race condition não resolvida, ainda não validada em uso real desde a migração.
- Bulking/manutenção sem cardápio de referência fixo no guia estático (o gerador cobre as três fases, mas o guia manual só tem cutting).
- `actionToggleHiddenCard`/`actionShowAllHidden` existem em `actions.ts` mas não são chamadas por lugar nenhum — candidato a dead code ou funcionalidade esquecida.
- Repaginação visual geral pós-migração — escopo ainda não definido.
- Itens de horizonte mais distante, sem escopo: aba de suplementação, tabela progressiva no Protocolo, fluxo de onboarding com TDEE, Protocolo com treino customizável (upper/lower), aba de Gráficos (desempenho + histórico), gamificação da comparação de peso.
- Do roadmap original de 19 itens só os de bug (Chat 1) e mobile (Chat 2) foram atacados — o restante ainda não tem chat definido nesse consolidado (o PDF completo com a divisão dos 11 chats está referenciado, mas não veio nos uploads que recebi).

---

## 8. Lições registradas (pra eu não repetir erro)

- Nunca reescrever um `*Client.tsx` de memória sem ler o real primeiro — mount plano do sandbox faz `page.tsx`/`actions.ts` colidirem entre rotas, então esses dois **sempre** precisam ser colados por você quando o bug envolve eles.
- `(app)` com parênteses no caminho quebra `cp` sem aspas no shell — se der erro de "instalação", perguntar primeiro **onde** falhou (VSCode, terminal, ou download do chat) antes de supor.
- Diffs que "explodem" podem ser só CRLF vs LF, não mudança de conteúdo — normalizar antes de alarmar.
