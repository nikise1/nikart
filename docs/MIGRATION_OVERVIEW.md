# Migration Plan: Legacy → Modern Stack + AI Agents

**Goal:** Sustainable, agent-maintained portfolio

---

## Step 1: Legacy App Audit

- Analyse codebase structure (routes, data flow, state management)
- Inventory animations (CSS, GSAP, Canvas)
- Identify tech debt and migration complexity
- **Deliverable:** `LEGACY_ANALYSIS.md`

---

## Step 2: Migration Planning

- Compare frameworks (Next.js, Remix, Astro)
- Define migration phases and effort estimates
- Establish agent maintainability requirements
- **Deliverable:** `MIGRATION_PLAN.md`
- **Deliverable:** `PROGRESS.md`

---

## Step 3: Stack Research & Selection

Use AI agents to research and evaluate current best practices:

- **Framework:** Use Copilot/Claude to compare React meta-frameworks (Next.js, Remix, Astro) against project requirements
- **Animation:** Research modern animation libraries (Framer Motion, Motion One, GSAP React)
- **State Management:** Evaluate options (Zustand, Jotai, TanStack Query, Redux Toolkit)
- **Testing:** Compare testing frameworks (Vitest vs Jest, Playwright vs Cypress)
- **Deployment:** Assess platforms (Vercel, Netlify, Cloudflare Pages)

**AI Research Prompts:**
- "What are the current best practices for [category] in 2024/2025?"
- "Compare [option A] vs [option B] for [use case]"
- "What are the trade-offs of [technology] for AI agent maintainability?"

**Deliverable:** `STACK_DECISION.md` with rationale for each choice

---

## Step 4: Project Setup & Architecture

- Initialise project with chosen stack
- Configure TypeScript, linting, testing
- Create AI agent rules (`.cursor/rules` or equivalent)
- Document code patterns for agent maintainability

---

## Step 5: Static Content Migration

- Convert routes to new framework pages
- Migrate HTML to components
- Apply styling approach from stack decision

---

## Step 6: Animation Modernisation

- Convert legacy animations to chosen library
- Validate animation fidelity and performance

---

## Step 7: Canvas & Interactivity

- Evaluate approach based on complexity (Three.js, PixiJS, vanilla Canvas)
- Migrate Canvas logic to chosen solution
- Integrate with animation system

---

## Step 8: AI Agent Infrastructure

Set up automated maintenance agents for:

- **Code Quality:** Linting, type-checking, unused imports
- **Testing:** Run test suites, coverage reports
- **Documentation:** Auto-generate docs, update README
- **Dependencies:** Security checks, update PRs
- **Stack Currency:** Periodic prompts to review if stack choices remain current

Configure CI/CD for scheduled agent tasks.

---

## Step 9: Testing & Documentation

- Unit and E2E tests with chosen frameworks
- README, architecture decisions, deployment guide

---

## Step 10: Deployment & Monitoring

- Deploy to chosen platform
- Set up monitoring (Web Vitals, error tracking)
- Enable automated agent maintenance

---

## Progress Tracker

- [ ] Step 1: Legacy App Audit
- [ ] Step 2: Migration Planning
- [ ] Step 3: Stack Research & Selection
- [ ] Step 4: Project Setup & Architecture
- [ ] Step 5: Static Content Migration
- [ ] Step 6: Animation Modernisation
- [ ] Step 7: Canvas & Interactivity
- [ ] Step 8: AI Agent Infrastructure
- [ ] Step 9: Testing & Documentation
- [ ] Step 10: Deployment & Monitoring

---

## Success Criteria

- Zero legacy dependencies
- All animations working identically
- Test coverage >80%
- Onboarding time for new devs <2 hours
- Automated agent maintenance running
- Stack decisions documented with AI-assisted rationale