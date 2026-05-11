# CLAUDE.md — faultlens-frontend-samples (ClaudeCode)

> **Read [AGENTS.md](AGENTS.md) first.** It is the canonical shared rule file covering sample purpose, work mode, GitHub tracking, branch rules, configuration/secret safety, SDK version, ingestion endpoint, Docker/nginx conventions, and validation expectations. This file contains only ClaudeCode-specific notes.

---

FaultLens Frontend Samples — Angular 21 sample app demonstrating FaultLens browser SDK integration.

## Layout

```
src/app/          Angular sample app source
docker/           runtime-config.sh — injects env vars into window.__FAULTLENS_SAMPLE_CONFIG__ at container start
nginx/            nginx configuration for Docker serving
public/           static assets
Dockerfile        multi-stage build (Angular + nginx)
docker-compose.yml  local Docker run
README.md         run instructions and integration guide
```

## Stack

| Layer | Choice |
|---|---|
| Framework | Angular 21 (standalone) |
| FaultLens SDK | `@faultlenshq/browser@0.1.0-beta.2` |
| Language | TypeScript 5.9 |
| Containerised run | Docker + nginx |

## Commands

```bash
npm start                # local dev server
npm run build            # production build → dist/
npm test                 # Karma/jsdom unit tests

docker build .                          # build container image
docker-compose up                       # run with Docker Compose (requires env vars)
```

## Non-obvious conventions

- **Runtime config injection**: `docker/runtime-config.sh` writes `window.__FAULTLENS_SAMPLE_CONFIG__` to a JS file served by nginx before the app loads. The app reads SDK config from this global. Do not assume `environment.ts` holds the live config.
- **No hardcoded secrets**: `FAULTLENS_TENANT_HOST` and `FAULTLENS_PROJECT_API_KEY` must come from environment variables — never committed values.
- **Beta SDK**: this sample tracks the current beta release. Check `@faultlenshq/browser` version in `package.json` before assuming any API is stable.
- **`private: true`**: this repo is not published to npm.

## ClaudeCode-specific notes

- Stay implementation-first. Keep samples simple — do not expand them into product applications.
- Read only the files needed for the task before editing. Prefer `Edit` (targeted diff) over full rewrites.
- Keep diffs narrow — no formatting churn, no unrelated renames.
- If sample behavior or run instructions change, update `README.md` in the same commit.
- After validation, update the GitHub issue using `C:\PersonalProjects\faultlens-ui\issue-body.md` and `gh issue comment`.
- Do not deploy or publish unless explicitly requested.
