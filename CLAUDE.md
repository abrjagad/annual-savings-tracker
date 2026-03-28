# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn dev           # Start both backend (port 3002) and frontend (port 5173) concurrently
yarn build         # Production build via Vite
yarn test          # Unit tests with Vitest
yarn test:e2e      # E2E tests with Playwright (headless)
yarn test:e2e:ui   # E2E tests with Playwright interactive UI
yarn lint          # BiomeJS lint
yarn format        # BiomeJS auto-format
yarn biome:check   # Full BiomeJS check with write
```

To run a single Vitest test file: `yarn test <filename>`

## Environment Setup

Copy `.env.example` to `.env`. The key variable is `GOOGLE_GENERATIVE_AI_API_KEY` for AI categorization. `VITE_API_BASE` defaults to `http://localhost:3002/api`.

## Architecture

This is a full-stack expense tracker: React + Vite frontend (`src/`) talking to an Express + SQLite backend (`server/`), with shared code in `shared/`.

### Backend (`server/`)

- `server/index.js` — all Express routes and AI categorization logic
- `server/db.js` — SQLite initialization; uses `database.sqlite` (or `test-database.sqlite` when `NODE_ENV=test`)
- API base: `http://localhost:3002/api`

**Key routes:**
- `GET/POST /api/entries`, `POST /api/entries/bulk`, `DELETE /api/entries/:id`, `POST /api/entries/bulk-delete`
- `PATCH /api/entries/:id/category` — updates category, learns a rule, applies it to matching entries
- `POST /api/entries/categorize` — two-phase: apply saved rules first, then call Gemini (with Ollama fallback) for uncategorized entries
- `GET/POST /api/accounts`, `GET/DELETE /api/category-rules/:id`

### Frontend (`src/`)

- `src/App.jsx` — root component holding global state (entries, accounts, filters, theme)
- `src/services/api.js` — all fetch calls to the backend
- `src/components/` — UI components (Dashboard, TransactionList, ImportModal, ExpenseCategoryChart, etc.)

State is managed with React hooks (no external state library). Dark mode is class-based with localStorage persistence.

### Shared (`shared/`)

- `shared/categories.js` — single source of truth for transaction categories (`CATEGORIES` object and `ALL_CATEGORIES` flat array for Zod validation). Both frontend and backend import from here.

### AI Categorization Flow

`POST /api/entries/categorize`:
1. Load saved `category_rules` from SQLite (learned pattern → category mappings)
2. Apply rules to uncategorized entries via substring matching
3. Send remaining uncategorized entries to Google Gemini (`@ai-sdk/google`); falls back to Ollama (`ollama-ai-provider-v2`) if Gemini unavailable
4. Persist newly categorized entries and optionally learn new rules

### Code Style

BiomeJS enforces formatting: tabs for indentation, double quotes, organized imports. The project uses ES modules (`"type": "module"` in package.json).
