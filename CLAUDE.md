# Expense Tracker App

## Commands

- `npm run dev` — start dev server (check output for actual port, 3000 may be occupied)
- `npm run build` — production build, also runs TypeScript type checking
- `npx prisma studio` — browse/edit the SQLite database
- `npx prisma db push` — sync schema changes to the database

## Architecture

- **Next.js 16** App Router with Turbopack. All pages are client components (`"use client"`).
- **Database**: SQLite via Prisma ORM. Schema in `prisma/schema.prisma`.
- **State**: React hooks only — no Redux/Zustand. The `useExpenses()` hook in `hooks/` is the single source of truth for expense data.
- **Styling**: Tailwind CSS. Primary color is indigo-600. Cards use `rounded-2xl shadow-sm border border-gray-200`.
- **Charts**: Recharts (PieChart, BarChart, LineChart). **Icons**: Lucide React.
- **Validation**: Zod schemas in `lib/validation.ts`, enforced server-side in API routes.

## Project Structure

- `app/<name>/page.tsx` — pages/routes
- `app/api/expenses/` — REST API (GET, POST, PUT, DELETE)
- `components/<feature>/` — reusable components grouped by feature (dashboard, expenses, insights, layout, export)
- `hooks/` — custom React hooks (`useExpenses` for all CRUD + fetch)
- `lib/utils.ts` — shared formatting (`formatCurrency`), aggregation, and chart data helpers
- `types/expense.ts` — TypeScript types, category constants, color maps, and emoji icons

## Conventions

- New pages: create `app/<name>/page.tsx`. Add nav link in `components/layout/Navbar.tsx`.
- New components: place in `components/<feature>/`. Prefer extracting components over large page files.
- Data fetching: use `useExpenses()` hook from client components. Never import Prisma in client code.
- Pages follow a consistent pattern: loading spinner → empty state → content.

## Known Pitfalls

- **Next.js 16 route params**: Route handler `params` are Promises and must be awaited: `const { id } = await params;`
- **Recharts formatter types**: Tooltip `formatter` value param is `ValueType | undefined`, not `number`. Use `Number(value)`.
- **Date format**: Expenses store dates as `YYYY-MM-DD` strings, not Date objects. Use `parseISO()` from date-fns.
