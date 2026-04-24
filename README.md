# FaultLens Frontend Samples

Angular sample app for testing the FaultLens browser SDK against your own tenant workspace.

This repo is intended for end users who want a minimal, cloneable sample before wiring FaultLens into their own frontend application.

## Beta preview

This sample uses the current beta browser SDK package and should be treated as an early preview integration path.

## Package used

```bash
npm install @faultlenshq/browser@beta
```

Current published beta used by this sample:

- `@faultlenshq/browser@0.1.0-beta.2`

## What you need

- Node.js 20+
- npm 10+
- your FaultLens tenant host
- your FaultLens project API key

## Where to get the tenant host

Use your tenant workspace host, for example:

```text
https://TENANT-SLUG.staging.faultlens.in
```

Do not use the shared app host for browser SDK ingestion.

## Where to get the project API key

In FaultLens, open the target project and copy the project ingest/API key from the project overview or setup surface.

## Current endpoint model

For the current staging and beta validation flow:

- configure the tenant host
- the SDK posts to `POST /api/events/ingest`
- the SDK sends the project key with `X-API-Key`

Central API host support is planned separately.

## Local run

```bash
npm install
npm start
```

Open:

```text
http://localhost:4200
```

Enter:

- tenant host
- project API key
- environment
- release prefix

Then click **Send test error**.

The sample creates a unique smoke ID and release suffix for each submission.

## Docker run

Build:

```bash
docker build -t faultlens-frontend-samples .
```

Run:

```bash
docker run --rm -p 8080:80 ^
  -e FAULTLENS_TENANT_HOST=https://TENANT-SLUG.staging.faultlens.in ^
  -e FAULTLENS_PROJECT_API_KEY=YOUR_PROJECT_API_KEY ^
  -e FAULTLENS_ENVIRONMENT=staging ^
  -e FAULTLENS_RELEASE_PREFIX=frontend-sample ^
  faultlens-frontend-samples
```

Then open:

```text
http://localhost:8080
```

`docker-compose.yml` is also included for convenience.

## How to verify the event in FaultLens hosted UI

1. Open your tenant workspace.
2. Open the project that matches the API key you used.
3. Open **Events**.
4. Search for the smoke ID or release shown by the sample app.
5. Open the event detail and confirm the environment and release values match the sample submission.
