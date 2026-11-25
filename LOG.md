# Log

Working context for this repository, newest first. This is a handoff document for the next
session — it records what the code cannot say for itself.

> Maintained under Structure. Append after completing a unit of work.
> Record why, what was rejected, gotchas, and where you stopped — not a diff summary.
> Keep 10 entries verbatim; compact the rest into Consolidated history. Delete lines whose
> value has expired.

---

## 2026-11-25 — Unify Net Ticket Omzet & Real Fees Across Dashboard, Reports & Ticket-Category

**Did:**
- Eliminated the `Rp 340.000` BayFest promo-discount discrepancy between `/dashboard` (`Rp 190.114.200` gross pre-discount) and `/dashboard/reports` (`Rp 189.774.200` net post-discount):
  - Backend (`D:\metix-api`):
    - Updated [OwnerDashboardService.php](file:///D:/metix-api/app/Services/Dashboard/OwnerDashboardService.php#L103-L130) `ticket_types_by_event` so `total_revenue` computes `orders.net_subtotal` (and added `total_discount`, `total_bruto`), matching `total_ticket_net` and `/dashboard/reports`.
    - Updated [EoDashboardService.php](file:///D:/metix-api/app/Services/Dashboard/EoDashboardService.php#L244-L280) `ticket_types_by_event` to also reflect `orders.net_subtotal`.
  - Frontend (`d:\metix-frontend`):
    - Renamed the Owner breakdown column in [src/app/dashboard/page.tsx](file:///d:/metix-frontend/src/app/dashboard/page.tsx) to `Omzet Tiket (Net)` with promo discount indicator (`Diskon: -Rp ...`) and passed `?event_id=...` on the `Rincian` link.
    - Updated [src/app/dashboard/reports/ticket-category/page.tsx](file:///d:/metix-frontend/src/app/dashboard/reports/ticket-category/page.tsx) to split `net_subtotal`, `tax_amount`, and real `platform_fee` across active tickets using integer remainder allocation, removing the forced 7% override.
- Verified parity across `OwnerDashboardService`, `EoDashboardService`, `/dashboard/reports`, and `npx tsc --noEmit` (0 errors).

**Why:**
- `/dashboard` showed pre-discount gross subtotal while `/dashboard/reports` showed post-discount net subtotal, causing conflicting numbers for the same event. Now `/dashboard`, `/dashboard/reports`, and `/dashboard/reports/ticket-category` match to the exact Rupiah.

---

## 2026-11-25 — Fix /dashboard/reports Initial National Data Load, Real Fees & CSV Totals

**Did:**
- Updated [src/app/dashboard/reports/page.tsx](file:///d:/metix-frontend/src/app/dashboard/reports/page.tsx) and [src/lib/api.ts](file:///d:/metix-frontend/src/lib/api.ts):
  - Removed the early empty-order guard when `selectedEventId === 'all'`, loading `PAID` orders for both `OWNER` (national platform summary across all events) and `EO` (all published EO events) on initial render so KPI cards and formula banner show real figures instead of `Rp 0` / `0 Pcs`.
  - Updated `fetchSalesReportData` (`per_page=100` on `fetchMyEvents`) and extracted a shared `getOrderFinancials` helper preserving explicit `0` values for `local_tax_amount` and `platform_fee` without forcing fallback `0.07` / `0.05` math.
  - Changed the accounting formula banner and CSV summary from `Fee Platform 7%` to `Fee Platform (Riil)` / `Fee Platform Riil`.
  - Fixed the 2-column alignment shift on the CSV `TOTAL AKUMULASI` row (aligned all 21 columns with header) and corrected expanded ticket sub-row ratio to use `netSubtotal`.
- Verified with `npx tsc --noEmit` (0 errors) and backend report verification.

**Why:**
- Initial `/dashboard/reports` load rendered `Rp 0` across all metrics, labels still referenced flat 7% fee instead of real tiered `orders.platform_fee`, and CSV export totals were misaligned by 2 columns.

---

## 2026-11-25 — Align Owner Dashboard Platform Commission & Tax with Real Order Data

**Did:**
- Switched platform commission and local tax metrics across backend and frontend from hardcoded percentages (`0.05` / `0.07`) to exact database aggregates from `PAID` orders (`orders.platform_fee` and `orders.local_tax_amount`).
- Backend (`D:\metix-api`):
  - In `OwnerDashboardService.php`, restored global `platform_commission` to `$paidOrders->sum('platform_fee')` and updated per-event `ticket_types_by_event` breakdown to sum actual `platform_fee` and `local_tax_amount` per event from paid orders (preserving tiered QRIS 5.9%–7%, VA 5%+Rp4.500, E-Wallet 9%, etc.).
- Frontend (`d:\metix-frontend`):
  - In `src/lib/api.ts`, removed the hardcoded 7% fallback on `commissionEarned` and aligned `taxCollected` with `revenue.tax_collected`.
  - In `src/app/dashboard/page.tsx`, kept global `Revenue Platform` on `total_gross`, renamed card & column headers to "Komisi Platform" / "Komisi Metix (Riil)" alongside "Pajak Daerah (5%)", and prevented `eventsList` merge from overwriting real backend commission/tax values.
- Verified backend `OwnerDashboardService` output and ran frontend TypeScript check (`npx tsc --noEmit`) with 0 errors.

**Why:**
- Metix platform revenue comes from tiered/method-specific checkout fees stored in `orders.platform_fee`, not a flat 7% or 5% rate. Using real DB sums guarantees consistency between global and per-event dashboard views.

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
