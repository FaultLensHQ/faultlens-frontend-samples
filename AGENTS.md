# AGENTS.md — faultlens-frontend-samples

Canonical shared instruction file for all coding agents (ClaudeCode, Codex, and equivalents).
This repo owns **frontend sample applications** for FaultLens — minimal, cloneable apps that help developers validate and demonstrate FaultLens SDK integration before wiring it into their own frontend.
Read this before starting any task in this repo.

---

## Sample principle

- Samples should help developers understand and validate FaultLens integration quickly.
- Samples should demonstrate useful error, event, and breadcrumb capture flows.
- Keep samples simple and realistic — they are onboarding tools, not product applications.
- Do not turn samples into full product apps with full auth, dashboards, or admin features.
- Every sample change should support faster onboarding, SDK validation, or triage-flow demonstration.

---

## Work mode

- Aggressive build mode. Implementation-first.
- Minimal, production-safe changes.
- Avoid broad rewrites unless explicitly required.
- Keep sample flows easy to run locally.

---

## GitHub tracking workflow

- Open a GitHub issue before starting feature work. Do not create duplicate issues.
- Use `C:\PersonalProjects\faultlens-ui\issue-body.md` as the scratch file for issue bodies and comments.
- After validation, update the issue using `gh issue comment` with `--body-file`.
- Do not close issues unless implementation is complete and validated.
- Keep GitHub CLI commands simple.

---

## Repo, branch, and release rules

- Repo name: `faultlens-frontend-samples`.
- Follow the existing branch convention used by this repo. Do not switch branch strategy casually.
- Do not publish npm packages — this repo is `"private": true`.
- Do not deploy unless explicitly requested.

---

## Sample app rules

- **No hardcoded secrets**: configuration is injected at runtime via `window.__FAULTLENS_SAMPLE_CONFIG__` (populated by `docker/runtime-config.sh` from environment variables). Do not embed real API keys, tenant credentials, or production hosts in committed code.
- **Environment variables**: the expected runtime variables are `FAULTLENS_TENANT_HOST`, `FAULTLENS_PROJECT_API_KEY`, `FAULTLENS_ENVIRONMENT`, and `FAULTLENS_RELEASE_PREFIX`. Use these names consistently.
- **SDK version**: the sample uses `@faultlenshq/browser@0.1.0-beta.3` and `@faultlenshq/angular@0.1.0-beta.2`. Do not bump SDK versions unless the issue explicitly requires it.
- **Ingestion endpoint**: the SDK posts to `POST /api/events/ingest` with `X-API-Key`. Preserve this unless the issue explicitly changes the endpoint model.
- **Docker/nginx**: preserve the Docker and nginx local run flow for each sample. The `docker/runtime-config.sh` injects config at container start — do not bypass or break this.
- **Sample layout**: keep each sample isolated under `samples/<sample-name>/src`. The direct browser SDK sample belongs under `samples/browser` and should remain framework-free TypeScript. Framework-native samples, including Angular and future React, should be sibling folders under `samples/`. Shared sample-only utilities and styles belong under `samples/shared`.
- **Sample errors should be intentional**: errors thrown in sample code should be deliberate, clearly labelled, and useful for validating FaultLens capture behavior. Do not add accidental or silent failures.
- **Keep README aligned**: if sample behavior, configuration, or run instructions change, update `README.md` to match.

---

## Validation expectations

- Run `npm run build` to confirm the Angular build passes.
- Run `npm test` if tests exist or were changed (Karma/jsdom).
- Confirm Docker builds with the app-specific Dockerfiles if Dockerfile or nginx config was changed.
- Include exact commands and results in the final response.

---

## Final response format

Max 8 bullets covering:

- Files changed
- What changed and why
- Validation commands and results
- GitHub issue update status
- Follow-up notes (only when useful)
