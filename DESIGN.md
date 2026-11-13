# Design

The visual contract for this repository. Any value in the code that contradicts this file is a defect.

> Maintained under Structure. Add a token here in the same change that introduces it in code.
> Never hardcode a value this file could name.

## Foundations

- **Styling system:** Tailwind CSS v4 + Radix UI / Shadcn UI primitives.
- **Theme source of truth:** `src/app/globals.css` and Tailwind theme configurations.
- **Color modes:** Light primary mode with high contrast accents.
- **Base unit:** 4px grid (standard Tailwind spacing scale).

## Color

Semantic names, not raw hex, are what code refers to.

| Token | Class / Value | Used for |
| --- | --- | --- |
| `primary` | `blue-600` / `blue-700` | Primary buttons, active tabs, main accents |
| `primary-foreground` | `white` | Text on primary buttons and badges |
| `background` | `slate-50` / `white` | Page and card backgrounds |
| `surface` | `white` | Dashboard cards, modals, popovers |
| `border` | `slate-200` / `slate-100` | Card borders, dividers, inputs |
| `foreground` | `slate-900` | Primary text, titles, headings |
| `muted-foreground` | `slate-500` / `slate-400` | Secondary descriptions, timestamps, subtitles |
| `success` | `emerald-600` / `emerald-50` | `ACTIVE` ticket badge, paid status, confirmations |
| `warning` | `amber-600` / `amber-50` | `INACTIVE` / pending status alerts |
| `danger` | `rose-600` / `rose-50` | `SOLD_OUT` ticket badge, delete actions, errors |

**Rules**
- Never introduce an arbitrary hex that duplicates or conflicts with existing theme tokens.
- Status badges use rounded pill borders with a colored indicator dot (e.g. `bg-emerald-50 text-emerald-700 border-emerald-200`).
- Sold-out tickets must use consistent visual styling: strikethrough price with rose decoration and `SOLD_OUT` badge.

## Typography

- **Font families:** System sans-serif stack (`Inter`, `system-ui`, `-apple-system`).
- **Headings:** Font weight `font-black` or `font-extrabold` for clean hierarchy.
- **Body:** `text-sm` or `text-xs` with `font-medium` or `font-semibold`.

