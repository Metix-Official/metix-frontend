# Coding Style

The conventions for this repository. This file governs every change made here.
Facts in the stack table are detected from the code; everything else is a deliberate choice.

> Maintained under Structure. Update the stack table when a dependency changes; update the
> command table when a command changes. Record a code pattern here the second time it is used.
> A stale entry here misleads every future session.

## Tech Stack

| Layer | Technology | Version | Notes |
| --- | --- | --- | --- |
| Language | TypeScript | ^5.0 | Strict mode enabled |
| Runtime | Node.js | >=20 | Standard Next.js server runtime |
| Framework | Next.js (App Router) | ^16.4 | React 19.2 |
| Package manager | npm / pnpm | - | Authoritative from lockfile |
| Frontend | React | 19.2 | Server & Client Components (`'use client'`) |
| Styling | Tailwind CSS | ^4.0 | PostCSS / Radix UI / Shadcn UI |
| Icons & UI | Lucide React, Radix UI, Sonner | Latest | Clean modern interface |
| Testing / Lint | ESLint, TypeScript compiler | ^9.0 / ^5.0 | Zero type errors required |
| Build tool | Next.js Turbopack / Webpack | ^16.4 | `npm run build` |

### Key libraries

| Library | Used for |
| --- | --- |
| `lucide-react` | Unified icons across dashboards and public pages |
| `sonner` | Toast notifications for user feedback |
| `date-fns` | Date parsing, formatting, and localization (`id-ID`) |
| `clsx`, `tailwind-merge` | Conditional class composition (`cn()` helper) |
| `@radix-ui/*` | Accessible headless dropdowns, dialogs, popovers |

## Commands

| Purpose | Command |
| --- | --- |
| Install | `npm install` |
| Dev server | `npm run dev` |
| Lint | `npm run lint` |
| Typecheck | `npx tsc --noEmit` |
| Build | `npm run build` |

## Conventions

### Naming

- **Components:** PascalCase (e.g. `TicketCategoriesCard.tsx`, `EventCheckoutClient.tsx`).
- **Pages & Routes:** Next.js App Router conventions (`page.tsx`, `layout.tsx`, `[id]/page.tsx`).
- **Utility functions:** camelCase (e.g. `getTicketManagementStatus`, `formatCurrency`).
- **Types & Interfaces:** PascalCase prefixed with `Api` for backend DTOs (e.g. `ApiTicketType`, `ApiEvent`).

### Directory layout

- `src/app/`: Next.js App Router routes (Dashboard, Events, Checkout, Reports, POS).
- `src/components/`: Reusable components (layout, UI, dashboard widgets).
- `src/lib/`: API clients, helpers, constants, and data formatters.
- `.agents/`: Project skills, plugins, and agent governance.

### Verification Discipline

- Run `npx tsc --noEmit` before considering any TypeScript or frontend task complete.
- Verify both desktop and responsive layouts for UI updates.

