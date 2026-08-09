# CLAUDE.md — faultlens-frontend-samples

Read `AGENTS.md` first. This file contains Claude-specific sample execution notes only.

## Purpose and context

FaultLens frontend samples are minimal integration/onboarding applications for the supported browser/framework SDKs. They demonstrate current supported SDK behavior; they do not define SDK product semantics.

Before editing:

- read the affected sample, current `package.json`/lockfile and SDK public API it uses;
- derive current framework/SDK/tool versions from authoritative repository configuration rather than this file;
- route any required SDK public-contract/privacy/ingestion change to the owning SDK/backend Product Decision/Design work rather than changing semantics inside a sample.

## Stable repository conventions

- Keep each sample isolated under the existing `samples/<sample-name>/` structure; genuinely shared sample-only utilities/styles belong in the shared sample area.
- Preserve the framework-free direct browser sample where currently supported; framework samples remain sibling integrations rather than being folded into one application.
- Preserve the existing runtime-configuration injection path used by Docker/nginx. Read exact variable/global names from current runtime-config scripts and sample code rather than copying volatile values into governance.
- Never hard-code real secrets, project API keys, tenant credentials or production-only endpoints.
- Keep this repository non-publishable as configured; do not publish packages.
- If sample behavior, configuration or run instructions change, update `README.md` in the same change.

## Editing and validation

- Prefer targeted diffs; avoid formatting churn and unrelated renames.
- Keep sample flows minimal and intentional; do not expand them into product applications.
- Intentional sample failures/errors must remain clearly labelled and useful for validating FaultLens capture.
- Use current package/workspace scripts for build/test and Docker validation where applicable; report exact commands/results.
- Persist material decisions/evidence in GitHub using repository-neutral temporary files when a body file is useful.
- Do not deploy or publish unless explicitly authorized.
