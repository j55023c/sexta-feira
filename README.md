JARVIS — Assistente de Voz Local (Python)
Assistente 100% offline, privacidade first. Roda no Windows.

Stack
STT: faster-whisper (CPU)
TTS: Piper TTS (pt-BR, voz faber-medium)
Wake word: Porcupine ("jarvis", "computer")
VAD + fallback: teclado (Enter)
Automação UI: Windows (msvcrt, pywinauto/uitools)
Comandos
hora data treino dieta lembrete status desligar ajuda

Instalação (Windows)
# 1. Python 3.11+ + Git
# 2. Clone
git clone https://github.com/marcosdionisio/jarvis-voice.git
cd jarvis-voice

# 3. Venv isolado
python -m venv .venv
.venv\Scripts\activate

# 4. Dependências
pip install -r requirements.txt

# 5. Modelos (baixa automático no 1º run)
#    - faster-whisper: base
#    - Piper: pt_BR-faber-medium + espeak-ng-data + DLLs

# 6. Rode
python main.py

## Configuração
Copie `.env.example` → `.env` e preencha:
- `PORCUPINE_ACCESS_KEY=` (grátis em console.picovoice.ai)
- Paths dos modelos se não padrão

## Status
🟡 Em desenvolvimento — funcionalidades core rodando.

#### `sexta-feira/README.md`
```markdown
# Sexta-feira — App Dieta/Treino/Rotina (Tauri + Rust + React)

App desktop (Windows) + mobile (Android) para organizar treino, dieta e rotina.

## Stack
- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Rust (Tauri v2)
- **IPC:** Commands type-safe (`#[tauri::command]`)
- **Build:** `cargo tauri build` → `.msi` (Windows) / `.apk` (Android)

## Funcionalidades (planejadas/em dev)
- Cadastro de treino (exercícios, séries, repetições, carga)
- Dieta (refeições, macros, checklist diário)
- Rotina/lembretes/checklists
- Progressão de carga automática
- Sincronização local (SQLite)
- Integração com JARVIS (comandos de voz)

## Desenvolvimento
```bash
# Pré: Rust (stable), Node 18+, pnpm/npm/yarn
git clone https://github.com/marcosdionisio/sexta-feira.git
cd sexta-feira

# Frontend
npm install
npm run dev          # Vite dev server

# Backend + Frontend junto (Tauri dev)
npm run tauri dev

# Build instaladores
npm run tauri build
# Artefatos em: src-tauri/target/release/bundle/

## Status
🟡 Em desenvolvimento — build funcional, features core em andamento.
