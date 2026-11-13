# Architecture Decision Records

Decisions that were expensive to make and would be expensive to reverse. Each file answers
"why is it built this way?" for a reader who has none of today's context.

> Maintained under Structure. A change matching a trigger below stops for an ADR and user
> confirmation **before** implementation, not after.

## Index

| # | Title | Status | Date |
| --- | --- | --- | --- |
| 0001 | Use Structure Governance & Gemini Specification Contract | Accepted | 2026-11-13 |

## When an ADR is required

- Adding, removing, or major-version-upgrading a dependency
- Data model and schema changes — new tables, type changes, indexes for performance, backfills
- Architectural structure — a new service, layer, top-level directory, or deployable unit
- Cross-cutting patterns — auth, error handling, state management, data fetching, caching, queues
- Anything that can break existing callers — signature, API shape, rename, changed default
- External integrations and new infrastructure dependencies
- Anything touching credentials, permissions, or cryptography

## When it is not

Bug fixes, features following an established pattern, styling, copy, tests, formatting,
local refactors, patch-version bumps, reverting an unreleased change.

**The test:** would a competent engineer joining in six months be confused by this choice,
or consider it obvious? Confusion means ADR.

## Conventions

- Filename: `NNNN-kebab-case-title.md`, four digits, sequential, never reused.
- Status is one of `Proposed`, `Accepted`, `Superseded by ADR-NNNN`, `Deprecated`.
- A superseded ADR is never edited or deleted — mark its status and link forward.
- Keep each record under ~80 lines. Density beats completeness; long ADRs go unread.
- Update this index in the same change as the ADR.

