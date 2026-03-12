# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server (localhost:3000)
npm run build    # production build + type-check + lint
npm run lint     # ESLint only
```

There are no tests. `npm run build` is the only way to verify correctness — always run it after making changes. Fix all TypeScript and ESLint errors before committing; the build fails on either.

## Architecture

**Next.js 14 App Router** — all pages are in `app/`, all components are Server-Component-safe by default. Any component that uses hooks or browser APIs must have `"use client"` at the top.

**Data layer** — there is no backend. All state lives in `localStorage`, managed by hooks in `hooks/`:

- `useExpenses` — single source of truth for expense CRUD. Key: `expense-tracker-data`. All pages receive `expenses` as a prop from this hook.
- `useExportHistory` — persists export history. Key: `exp-history`. Seeds demo data once on first load using a permanent `exp-history-seeded` flag; clearing history does not re-trigger the seed.
- `useExportPrefs` — persists last-used export modal settings. Key: `exp-prefs`.

Each hook follows the same pattern: initialize from `DEFAULT_*` constant (SSR-safe), hydrate from `localStorage` in a `useEffect`, expose an `updateX(patch)` function that merges and saves.

**Type system** — two type files:

- `types/expense.ts` — core domain: `Expense`, `Category`, `FilterOptions`, plus the display constants `CATEGORY_COLORS`, `CATEGORY_BG`, `CATEGORY_ICONS`.
- `types/export.ts` — export domain: `ExportFormat`, `ExportOptions`, `ExportTemplate`, `TemplateId`, `ExportHistoryEntry`, `ExportPrefs`.

**Export system** (on `feature-data-export-combined`) has two layers:

- `lib/exportEngine.ts` — handles the actual file generation for custom exports: `exportAsCSV`, `exportAsJSON`, `exportAsPDF` (PDF uses dynamic `import()` for jsPDF to avoid SSR). All cell values pass through `sanitizeCell()` for formula injection protection. Column order is always Date → Category → Amount → Description.
- `lib/exportTemplates.ts` — defines 6 named templates (`tax-report`, `monthly-summary`, `category-analysis`, `full-export`, `year-in-review`, `custom`). The `custom` template is a pass-through to the engine; the rest have their own data builders. Templates use `toCsv()` which always double-quotes all fields.
- `components/export/ExportModal.tsx` — 4-step wizard (template → configure → preview → done). Reads preferences from `useExportPrefs` and restores them on mount. Writes history via `useExportHistory.addEntry()` on both success and failure.

**Utility functions** in `lib/utils.ts` are pure functions over `Expense[]` used by dashboard charts and summary cards: `getMonthlyChartData`, `getCategoryTotals`, `filterExpenses`, etc.

## Styling conventions

Tailwind only — no CSS modules or styled-components. Color scheme is indigo/purple (`indigo-600` as primary). Interactive elements use `rounded-xl` with `transition-colors`. The `CATEGORY_BG` record in `types/expense.ts` is the single source of truth for category badge colors.

## Iterator compatibility

The TypeScript config targets an older ES version. Never use `[...iterator]` spread or `for...of` on Map/Set iterators — use `Array.from()` instead. This has caused build failures before.
