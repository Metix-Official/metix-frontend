# Log

Working context for this repository, newest first. This is a handoff document for the next
session — it records what the code cannot say for itself.

> Maintained under Structure. Append after completing a unit of work.
> Record why, what was rejected, gotchas, and where you stopped — not a diff summary.
> Keep 10 entries verbatim; compact the rest into Consolidated history. Delete lines whose
> value has expired.

---

## 2026-11-24 — Fix Owner Dashboard Multi-EO & Multi-Event Metrics & Filter Approval

**Did:**
- Investigated and resolved the root cause of "Organisasi Bayfest" showing 0 sold tickets and Rp 0 revenue in the Owner Dashboard breakdown table and filtered metrics cards.
- Backend fix (`D:\metix-api`):
  - In `OwnerEventController.php`, eager-loaded `ticketTypes` on `Event::query()` so `EventResource` serializes ticket categories for platform master events.
  - In `OwnerDashboardService.php`, grouped paid orders by `event_id` to provide actual gross revenue (`$eventPaidOrders`), commission (5%), and organizer name in `ticket_types_by_event`.
- Frontend fix (`d:\metix-frontend`):
  - In `src/lib/api.ts`, preserved `ticket_types_by_event` on top-level `DashboardResponse` and added `per_page` query parameter handling to `fetchOwnerOrganizers`.
  - In `src/app/dashboard/page.tsx`, updated Owner initial data fetch to request approved organizers (`status: 'ACTIVE', per_page: 100`).
  - Restricted the "Pilih Mitra Event Organizer (EO)" select dropdown to only display active/approved organizers (`status === 'ACTIVE' || status === 'APPROVED'`), preventing unapproved or rejected organizers from appearing.
  - Linked `ownerEventPerformanceList` and reactive stat cards to `ticket_types_by_event` and `eventsList`, accurately displaying BayFest (1.421 tickets sold, 10.700 quota, Rp 211.789.376 gross omzet, +Rp 10.589.469 platform commission).
- Verified with TypeScript typecheck (`npx tsc --noEmit`) with 0 errors.

**Why:**
- Backend eager-loading was omitting ticket types, API payload wrapping caused frontend state to fall back to unpopulated arrays, and the organizer selector previously included all unapproved/rejected organizer records.

---

## 2026-11-17 — Upgraded Next.js to 16.4.6 (Security Patch)

**Did:**
- Upgraded `next` from `16.4.1` to `16.4.6` in `package.json` and lockfile.
- Ran TypeScript verification gate (`npx tsc --noEmit`) with 0 errors.

**Why:**
- To patch a known security advisory present in Next.js 16.4.1.

---

## 2026-11-13 — Repo Hygiene Cleanup (/st-clean)

**Did:**
- Removed accidental leftover file `toArray())` from repository root via atomic chore commit.

**Why:**
- File was a stray PHP PsySH parse error log from backend work, unused by this frontend project.

---

## 2026-11-13 — Installed Structure Plugins & Bootstrapped GEMINI.md

**Did:**
- Installed `structure-plugins` (including `structure-core` and `code-mentor`) into `.agents/plugins/` and registered all 23 skills in `.agents/skills/`.
- Converted all `CLAUDE.md` / `claude.md` templates, commands, and rules references to `GEMINI.md`.
- Bootstrapped project governance artifacts: `GEMINI.md`, `CODINGSTYLE.md`, `DESIGN.md`, and `docs/adr/`.

**Why:**
- To enable project governance, ADR gating, commit workflows, and verification discipline directly in Antigravity / Gemini for `metix-frontend`.

**Watch out:**
- Workspace skills in `.agents/skills/` are auto-discovered by Antigravity in this project.
- Slash commands like `/st-init`, `/st-status`, `/st-check`, `/st-adr`, `/st-commit` are mapped to executable skills.

**Next:**
- Use `/st-status` at any time to verify document freshness and project hygiene.

---

## 2026-11-12 — Ticket Management Active / Sold Out Sorting & Identity Select

**Did:**
- Implemented ticket and category sorting by status priority (`ACTIVE` top, `SOLD_OUT` bottom) in both EO modal (`EoEventsView.tsx`) and Owner/EO ticket management (`/dashboard/events/[id]/tickets/page.tsx`).
- Created shared helper `groupAndSortTicketTypes` and `getTicketManagementStatus` in `src/lib/api.ts`.
- Integrated Shadcn `Select` for buyer identity types (KTP/Passport) on `/events/[id]/checkout`.

**Watch out:**
- Both total quota and available stock determine effective `SOLD_OUT` status even if raw DB status is `ACTIVE`.

---

## Consolidated history

- **2026-11:** Ticket categories filtering, ticket category detail report page, checkout ticket priority sorting.

