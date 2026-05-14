# FaultLens Frontend Samples

Frontend sample apps for testing FaultLens SDK packages against your own tenant workspace.

This repo is intended for end users who want minimal, cloneable samples before wiring FaultLens into their own frontend application.

## Beta preview

These samples use the current beta SDK packages and should be treated as early preview integration paths.

## Package used

```bash
npm install @faultlenshq/browser@0.1.0-beta.3
npm install @faultlenshq/angular@0.1.0-beta.2 @faultlenshq/browser@0.1.0-beta.3
npm install @faultlenshq/react@0.1.0-beta.1 @faultlenshq/browser@0.1.0-beta.3 react react-dom
```

Current published beta used by this sample:

- `@faultlenshq/browser@0.1.0-beta.3`
- `@faultlenshq/angular@0.1.0-beta.2`
- `@faultlenshq/react@0.1.0-beta.1`

## Samples

- `samples/browser`: framework-free TypeScript app that uses `@faultlenshq/browser` directly.
- `samples/angular`: Angular 21 app that uses `@faultlenshq/angular` and its Angular service/module API.
- `samples/react`: React 19 app that uses `@faultlenshq/react` provider, hook, and error boundary APIs.
- `samples/shared`: runtime config and shared styling used by the sample apps.

This layout keeps each sample app isolated. Future framework samples should live beside these under `samples/`.

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
npm run start:browser
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
It also sets diagnostics context with `userId = local-browser-demo-user` and tags for `sample`, `feature`, and `flow`.

## Angular sample

Run the Angular sample separately:

```bash
npm run start:angular -- --port 4201
```

Open:

```text
http://localhost:4201
```

Use the same tenant host, project API key, environment, and release prefix, then click:

- **Send Angular message**
- **Send Angular exception**

The Angular flow uses `FaultLensModule.forRoot(...)` and `FaultLensService`, sets `userId = angular-demo-user`, and attaches tags for `sample=angular`, `feature=angular-native`, and `flow=manual-smoke-test`.

## React sample

Run the React sample separately:

```bash
npm run start:react
```

Open:

```text
http://localhost:4202
```

Use the same tenant host, project API key, environment, and release prefix, then click:

- **Send React message**
- **Send React exception**
- **Trigger boundary error**

The React flow uses `FaultLensProvider`, `useFaultLens()`, and `ErrorBoundary`, sets `userId = react-demo-user`, and attaches tags for `sample=react`, `feature=react-native`, and `flow=manual-smoke-test`.

## Docker run

Build and run the browser SDK sample:

```bash
docker build -f Dockerfile.browser -t faultlens-browser-sample .
```

```bash
docker run --rm -p 8080:80 ^
  -e FAULTLENS_TENANT_HOST=https://TENANT-SLUG.staging.faultlens.in ^
  -e FAULTLENS_PROJECT_API_KEY=YOUR_PROJECT_API_KEY ^
  -e FAULTLENS_ENVIRONMENT=staging ^
  -e FAULTLENS_RELEASE_PREFIX=frontend-browser-sample ^
  faultlens-browser-sample
```

Build and run the Angular sample:

```bash
docker build -f Dockerfile.angular -t faultlens-angular-sample .
```

```bash
docker run --rm -p 8081:80 ^
  -e FAULTLENS_TENANT_HOST=https://TENANT-SLUG.staging.faultlens.in ^
  -e FAULTLENS_PROJECT_API_KEY=YOUR_PROJECT_API_KEY ^
  -e FAULTLENS_ENVIRONMENT=staging ^
  -e FAULTLENS_RELEASE_PREFIX=frontend-angular-sample ^
  faultlens-angular-sample
```

Build and run the React sample:

```bash
docker build -f Dockerfile.react -t faultlens-react-sample .
```

```bash
docker run --rm -p 8082:80 ^
  -e FAULTLENS_TENANT_HOST=https://TENANT-SLUG.staging.faultlens.in ^
  -e FAULTLENS_PROJECT_API_KEY=YOUR_PROJECT_API_KEY ^
  -e FAULTLENS_ENVIRONMENT=staging ^
  -e FAULTLENS_RELEASE_PREFIX=frontend-react-sample ^
  faultlens-react-sample
```

Then open one of:

```text
http://localhost:8080
http://localhost:8081
http://localhost:8082
```

`docker-compose.yml` runs all samples: browser SDK on port `8080`, Angular on port `8081`, and React on port `8082`.

## How to verify the event in FaultLens hosted UI

1. Open your tenant workspace.
2. Open the project that matches the API key you used.
3. Open **Events**.
4. Search for the smoke ID or release shown by the sample app.
5. Open the event detail and confirm the environment and release values match the sample submission.
6. Confirm diagnostics context includes the requested URL, browser user agent, `userId = local-browser-demo-user`, and tags for `sample=frontend`, `feature=diagnostics-context`, and `flow=manual-smoke-test`.
7. For Angular submissions, confirm `userId = angular-demo-user` and tags for `sample=angular`, `feature=angular-native`, and `flow=manual-smoke-test`.
8. For React submissions, confirm `userId = react-demo-user` and tags for `sample=react`, `feature=react-native`, and `flow=manual-smoke-test`.

The browser SDK captures URL/referrer/user-agent context from browser globals where available. The sample does not read or send cookies, `localStorage`, `sessionStorage`, request bodies, or secrets.
