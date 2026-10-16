# Agent Rules

## Main App

- **`www-root/` is the main app** (Next.js). The 2014 Express app is in `legacy-2014/` and is secondary.
- **One-word run command** from repo root: `www-root` → `npm run www-root` (starts the Next.js dev server). `npm run legacy-2014` starts the Express site.

## Storage

- **Never** use the memory tool. All notes, decisions, and preferences go in markdown files in this repo.

## Workflow

- Always update `docs/PROGRESS.md` after completing a task/step.
- In one chat, stay on the branch that chat already has. Do not create a second branch or pull request for later work in the same conversation. Commit follow-ups on that branch.
- After pushing a branch that has a pull request, include the stable Vercel branch preview URL from that pull request’s Vercel comment in the summary. That URL stays the same for the life of the branch. `https://nikart-beta.vercel.app` is the shared beta site, not the branch preview.

## Edit portfolio JSON

When the user says **edit json data**:

1. From the repo root, run `npm run json:edit`.
2. Reply with the printed URLs. They open [JSON Editor Online](https://jsoneditoronline.org) with `content/json/main.json` (menu links and order), `content/json/items.json` (flat content objects), and `content/json/other.json` (shared en/es UI text) already loaded in tree mode. Do not paste the file bodies into the chat.
3. When they bring edited JSON back, write it to the matching source file with 4-space indentation and a trailing newline, then run `npm run sync:json --prefix www-root`. That compiles `content/json/data.json` and minifies the Flash copy.

## Documentation Updates

- Every adjustment/fix: add a brief summary to the relevant section in `docs/MIGRATION_PLAN.md`.
- Big tasks (new features, component removal, architectural changes): also add an entry to `docs/PROGRESS.md`.
