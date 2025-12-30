# Project overview

## Purpose
Tauri + React + TypeScript desktop app template (inspect). Rust core provides performance and file/search/Git operations; React UI is presentation and user interaction.

## Tech stack
- Frontend: TypeScript, React, Vite, TailwindCSS, shadcn/ui, Radix UI, Biome (formatter/linter), Vitest, Bun
- Backend: Rust (Tauri backend), ripgrep (rg), notify (fs watcher), git2/libgit2
- Desktop shell: Tauri
- AI integration layer: tool-calling LLMs (OpenAI/Gemini/Claude/local)

## Architecture highlights
- Rust Core is the single source of truth; UI is non-blocking and does not touch file I/O directly.
- Communication via async Tauri IPC; backend streams results/events to UI.
- AI can only plan/decide, not execute; Rust exposes limited tools and enforces plan→dry-run→execute→log→undo.

## Repo structure (high level)
- `frontend/`: React UI (features, shared, apps, styles)
- `backend/`: Rust/Tauri backend and config
- Root: Vite config, TS configs, Biome config, docs
