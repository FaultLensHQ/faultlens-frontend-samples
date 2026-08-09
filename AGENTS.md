# AGENTS.md — faultlens-frontend-samples

Repository-local overlay for FaultLens frontend sample applications.

Samples are onboarding/integration tools, not product applications.

## Purpose

- demonstrate FaultLens SDK integration quickly and realistically;
- provide intentional error/event/breadcrumb flows that developers can run locally;
- stay minimal enough to clone/read without teaching unsafe production patterns.

## Stable rules

- Never hard-code real secrets, API keys, tenant credentials or production-only endpoints.
- Use the repository's existing runtime configuration mechanism/environment variables; do not bypass it by embedding values in source.
- Read current SDK/package versions from `package.json`/lockfiles. Do not duplicate volatile versions in this governance file.
- Preserve the current ingestion/public SDK contract unless an explicitly approved SDK/product decision changes it.
- Keep each sample isolated under the repository's existing sample structure; shared sample-only utilities belong in the shared sample area.
- Intentional sample errors must be clearly labelled and useful for capture validation.
- Keep README/run instructions aligned when behavior/configuration changes.
- Preserve Docker/nginx/runtime-config flows where the affected sample uses them.

## Decision boundary

A sample task must not redefine SDK public semantics, package versions, ingestion contracts or privacy behavior. If a change requires that, route the decision/design to the owning SDK/backend work first.

**Discovery does not imply priority.** Do not turn sample cleanup into a product/SDK redesign.

## Repository discipline

- GitHub issues/PRs are the durable work record.
- Persist decisions/evidence in GitHub rather than workstation-specific scratch paths.
- Follow this repo's actual default branch/release configuration.
- Do not publish packages or deploy unless explicitly authorized.

## Validation

Use current `package.json`/workspace configuration to run the affected build/tests and Docker validation where applicable. Report exact commands/results; never claim an unexecuted check passed.
