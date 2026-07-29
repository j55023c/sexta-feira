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

|| Fase | O quê ||
|---|---|
| Origem | `index.html` monolítico, PWA single-file, Supabase auth+dados, ~3000 linhas |
| Bugs de sync | Vários chats resolvendo persistência de dados entre sessões/dispositivos (arquitetura local-first identificada como causa raiz, depois arquitetura de 10 tabelas + `dbSave*/dbLoad*` + sessão única) |
| Decisão de migração | HTML de 3k linhas virou "arquitetura por acidente" — decidido migrar pra Next.js 14 + TS + Tailwind + Vercel |
| Migração base | Auth + Sidebar + Home + Tarefas + Notas + Protocolo migrados e funcionando na Vercel |
| Migração completa | Todos os módulos entregues (Dieta, Nutrição, Físico, Calculadora, Configurações); base TACO criada |
| Motor de cardápio (19/07/2026) | Gerador de cardápio via TACO (570 combinações validadas), aba "Meus Cardápios" na Dieta |
| Roadmap definido | 19 pendências organizadas em prioridade + ~11 blocos de chat |
| Chat 1 (concluído) | Bug de cálculo na Nutrição (escala duplicada, não era só float) + bug de virada de data (UTC vs local) — corrigidos |
|| **Chat 2 (concluído)** | Mobile responsivo — sidebar/drawer, grids responsivos, modais/drawers bottom-sheet ||
|| **Chat 3 (concluído)** | Nutrição (features): barras de macros compactas, água (log + UI), alimento manual "na mão" ||

---

## 6. Onde você parou exatamente agora

**Chat 2 — CONCLUÍDO** (mobile responsivo: sidebar/drawer, grids, modais/drawers bottom-sheet).

**Chat 3 — CONCLUÍDO** (Nutrição features):
1. Barras de macros compactas (Kcal/Prot/Carbo/Gord com meta)
2. Água na aba Nutrição — log `water_log` + UI (ring + barra + botões ±200ml)
3. Alimento manual "na mão" — aba no modal com campos Nome/Kcal/Prot/Carbo/Gord/Qty

**Chat 4 — PRÓXIMO** (Tema & Sessão):
1. Seletor de tema: aplicar `data-theme` no server a partir de `profile.tema` (evita flash)
2. Sessão única (`active_sessions`) — race condition não resolvida

---

## 7. Backlog pendente (organizado por chat)

**Chat 3 — Nutrição (features) ✅**
- [x] Barras de macros compactas (Kcal/Prot/Carbo/Gord com meta)
- [x] Água na aba Nutrição (existia no HTML original, não migrou) — log `water_log` + UI
- [x] Alimento manual "na mão" (kcal/macros diretos — complementa TACO) — aba no modal

**Chat 4 — Tema & Sessão**
- [ ] Seletor de tema: aplicar `data-theme` no server a partir de `profile.tema` (evita flash)
- [ ] Sessão única (`active_sessions`) — race condition não resolvida

**Chat 5 — Dieta (guia estático)**
- [ ] Bulking/manutenção no guia (só cutting existe; gerador já cobre as 3)
- [ ] `actionToggleHiddenCard`/`actionShowAllHidden` — dead code ou feature esquecida?

**Chat 6 — Repaginação visual**
- [ ] Escopo a definir

**Chat 7+ — Horizonte distante** (sem escopo definido)
- Aba suplementação, tabela progressiva no Protocolo, onboarding TDEE, Protocolo customizável (upper/lower), aba Gráficos, gamificação peso

Do roadmap original de 19 itens: Chat 1 (bugs), Chat 2 (mobile) ✅ — restante aguarda chats definidos.

---

## 8. Lições registradas (pra eu não repetir erro)

- Nunca reescrever um `*Client.tsx` de memória sem ler o real primeiro — mount plano do sandbox faz `page.tsx`/`actions.ts` colidirem entre rotas, então esses dois **sempre** precisam ser colados por você quando o bug envolve eles.
- `(app)` com parênteses no caminho quebra `cp` sem aspas no shell — se der erro de "instalação", perguntar primeiro **onde** falhou (VSCode, terminal, ou download do chat) antes de supor.
- Diffs que "explodem" podem ser só CRLF vs LF, não mudança de conteúdo — normalizar antes de alarmar.

---

## 9. Fechamentos de chat (histórico)

### Sexta-feira — 28/07/2026 18:45
STATUS: Chat 3 completo — Nutrição features finalizadas
FEITO: Barras macros compactas (Detalhe), Água (log water_log + UI ring/barra + botões ±200ml), Alimento manual (aba "Manual" no modal com Kcal/Prot/Carbo/Gord/Qty). MacroRings removido (ficará pra repaginação visual). Build limpo.
PRÓXIMO: Chat 4 — Tema & Sessão (data-theme server-side, race condition active_sessions)
PENDÊNCIA: Nenhuma
