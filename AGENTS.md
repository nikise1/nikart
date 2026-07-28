# Agent Rules

## Main App

- **`modern/` is the main app** (Next.js). Legacy at repo root is secondary during migration.
- **One-word run command** from repo root: `modern` → `npm run modern` (starts the Next.js dev server).

## Storage

- **Never** use the memory tool. All notes, decisions, and preferences go in markdown files in this repo.

## Workflow

- Always update `docs/PROGRESS.md` after completing a task/step.

## Documentation Updates

- Every adjustment/fix: add a brief summary to the relevant section in `docs/MIGRATION_PLAN.md`.
- Big tasks (new features, component removal, architectural changes): also add an entry to `docs/PROGRESS.md`.
