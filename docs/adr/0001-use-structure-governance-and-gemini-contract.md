# ADR-0001: Adopt Structure Governance and GEMINI.md Contract

- **Status:** Accepted
- **Date:** 2026-11-13
- **Deciders:** User & Antigravity Agent

## Context

The repository previously lacked durable memory across agent sessions, leading to lost session context and unrecorded conventions. We need a standardized governance structure that integrates with Antigravity / Gemini while adhering to clean engineering standards, verification gates, and atomic commits.

## Decision

We adopt the Structure governance framework (`structure-plugins`) configured for Antigravity / Gemini:
1. `GEMINI.md` as the root entry point defining requirements, constraints, and project pointers.
2. `CODINGSTYLE.md` for tech stack facts, command vocabulary, and coding conventions.
3. `DESIGN.md` for color, typography, spacing tokens, and component UI rules.
4. `LOG.md` for cross-session handoffs, recent achievements, gotchas, and next steps.
5. `docs/adr/` for Architecture Decision Records.

## Consequences

### Easier

- Seamless context continuity across agent sessions.
- Clear command vocabulary and verification requirements (`npx tsc --noEmit`).
- Safe atomic commits and pre-implementation ADR validation.

### Harder

- Every major architectural decision or package addition requires drafting and accepting an ADR first.
- Requires appending to `LOG.md` after significant session outcomes.

## Alternatives considered

### Implicit Memory / Ad-hoc Prompting

Rejected because context is lost between chat sessions, leading to inconsistent styling and repeated questions.

## Notes

All templates and references have been migrated from `CLAUDE.md` to `GEMINI.md`.

