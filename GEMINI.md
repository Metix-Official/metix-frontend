# Metix Frontend (metix-web)

Frontend ticketing and event management dashboard platform for Metix (supporting Event Organizers, Admins/Owners, POS Cashiers, and Buyer Checkout).

## Requirements

- Event management lifecycle for Event Organizers (EO) and Admins/Owners.
- Ticket creation, pricing, quota management, and active/sold-out prioritization.
- POS cashier management and on-site offline ticket sales.
- Buyer event discovery, responsive checkout, payment integration, and e-ticket generation.

## Constraints

- Next.js 16+ App Router with React 19 and TypeScript.
- Tailwind CSS v4 styling with Radix UI / Shadcn UI primitives.
- Mobile and desktop responsive layouts.
- Strict type checking with TypeScript (`npx tsc --noEmit`).

## Repository

| | |
| --- | --- |
| Host | GitHub (https://github.com/Metix-Official/metix-frontend.git) |
| Default branch | `main` |
| Branch naming | `<type>/<short-kebab-description>` |
| Deploy target | Vercel / Node.js Production Server |
| Environments | Local (`localhost:3000`), Staging, Production |

## Working rules

- Commits are atomic and follow Conventional Commits.
- No decorative emojis in code, comments, logs, commit messages, or docs.
- Patterns that must stay consistent are recorded in `CODINGSTYLE.md` (code) and `DESIGN.md` (appearance), not left to memory.

## Project standards

- Coding conventions and tech stack: @CODINGSTYLE.md
- Design tokens and styling rules: @DESIGN.md
- Recent work and session context: @LOG.md
- Architecture decisions: docs/adr/

