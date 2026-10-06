# Agent Rules

## Main App

- **`modern/` is the main app** (Next.js). Legacy at repo root is secondary during migration.
- **One-word run command** from repo root: `modern` → `npm run modern` (starts the Next.js dev server).

## Storage

- **Never** use the memory tool. All notes, decisions, and preferences go in markdown files in this repo.

## Workflow

- Always update `docs/PROGRESS.md` after completing a task/step.
- In one chat, stay on the branch that chat already has. Do not create a second branch or pull request for later work in the same conversation. Commit follow-ups on that branch.
- After pushing a branch that has a pull request, include the stable Vercel branch preview URL from that pull request’s Vercel comment in the summary. That URL stays the same for the life of the branch. `https://nikart-beta.vercel.app` is the shared beta site, not the branch preview.

## Edit portfolio JSON

When the user says **edit json data**:

1. From the repo root, run `npm run json:edit`.
2. Reply with the printed URL. It opens [JSON Editor Online](https://jsoneditoronline.org) with `public/content/json/data.json` already loaded in tree mode. Do not paste the file body into the chat.
3. When they bring edited JSON back, write it to `public/content/json/data.json` with 4-space indentation and a trailing newline, then run `npm run sync:json --prefix modern`.

## Documentation Updates

- Every adjustment/fix: add a brief summary to the relevant section in `docs/MIGRATION_PLAN.md`.
- Big tasks (new features, component removal, architectural changes): also add an entry to `docs/PROGRESS.md`.
