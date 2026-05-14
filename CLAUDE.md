# CLAUDE.md - faultlens-frontend-samples (ClaudeCode)

> **Read [AGENTS.md](AGENTS.md) first.** It is the canonical shared rule file covering sample purpose, work mode, GitHub tracking, branch rules, configuration/secret safety, SDK version, ingestion endpoint, Docker/nginx conventions, and validation expectations. This file contains only ClaudeCode-specific notes.

---

FaultLens Frontend Samples - framework-focused sample apps demonstrating FaultLens browser and Angular SDK integration.

## Layout

```
samples/browser/  Framework-free TypeScript app using @faultlenshq/browser directly
samples/angular/  Angular 21 app using @faultlenshq/angular
samples/react/    React app using @faultlenshq/react
samples/shared/   Shared runtime config reader and sample page styling
docker/                      runtime-config.sh injects env vars into window.__FAULTLENS_SAMPLE_CONFIG__
public/                      static assets served by each sample app
Dockerfile.browser           browser SDK sample image
Dockerfile.angular           Angular sample image
Dockerfile.react             React sample image
docker-compose.yml           local Docker run for all samples
README.md                    run instructions and integration guide
```

## Stack

| Layer | Choice |
|---|---|
| Frameworks | TypeScript/browser, Angular 21 standalone, React 19 |
| FaultLens SDK | `@faultlenshq/browser@0.1.0-beta.3`, `@faultlenshq/angular@0.1.0-beta.2`, `@faultlenshq/react@0.1.0-beta.1` |
| Language | TypeScript 5.9 |
| Containerised run | Docker + nginx |

## Commands

```bash
npm start                # browser SDK sample static dev server
npm run start:browser    # browser SDK sample static dev server
npm run start:angular    # Angular sample dev server
npm run start:react      # React sample static dev server
npm run build            # production build for all samples
npm test                 # Angular unit tests, if specs exist

docker build -f Dockerfile.browser .    # build browser SDK sample image
docker build -f Dockerfile.angular .    # build Angular sample image
docker build -f Dockerfile.react .      # build React sample image
docker-compose up                       # run all samples with Docker Compose (requires env vars)
```

## Non-obvious conventions

- **Runtime config injection**: `docker/runtime-config.sh` writes `window.__FAULTLENS_SAMPLE_CONFIG__` to a JS file served by nginx before the app loads. The app reads SDK config from this global. Do not assume `environment.ts` holds the live config.
- **Sample isolation**: each app owns its entrypoint under `samples/<sample-name>/src`. Shared code belongs in `samples/shared`. Add future samples, such as React, as sibling folders under `samples/`.
- **No hardcoded secrets**: `FAULTLENS_TENANT_HOST` and `FAULTLENS_PROJECT_API_KEY` must come from environment variables and never committed values.
- **Beta SDK**: this sample tracks the current beta release. Check `@faultlenshq/browser` version in `package.json` before assuming any API is stable.
- **`private: true`**: this repo is not published to npm.

## ClaudeCode-specific notes

- Stay implementation-first. Keep samples simple and do not expand them into product applications.
- Read only the files needed for the task before editing. Prefer targeted diffs over full rewrites.
- Keep diffs narrow: no formatting churn and no unrelated renames.
- If sample behavior or run instructions change, update `README.md` in the same commit.
- After validation, update the GitHub issue using `C:\PersonalProjects\faultlens-ui\issue-body.md` and `gh issue comment`.
- Do not deploy or publish unless explicitly requested.
