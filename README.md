# FaultLens Frontend Samples

Frontend sample apps for testing FaultLens SDK packages against your own tenant workspace.

These samples are minimal, cloneable onboarding apps that help developers validate FaultLens integration before wiring the SDK into their own frontend. They demonstrate diagnostic evidence, breadcrumbs, route/page context, and safe manual capture flows.

## Beta preview

These samples use beta SDK packages and should be treated as early preview integration paths.

## Packages used

Install the SDK packages unpinned — the wrapper `peerDependencies` resolve a compatible
`@faultlenshq/browser` automatically, so these commands never produce a peer-dependency conflict:

```bash
npm install @faultlenshq/browser
npm install @faultlenshq/angular @faultlenshq/browser
npm install @faultlenshq/react @faultlenshq/browser react react-dom
```

- `@faultlenshq/browser` — framework-free browser SDK sample.
- `@faultlenshq/angular` — Angular sample (wrapper over the browser SDK).
- `@faultlenshq/react` — React sample (wrapper over the browser SDK).

This repo pins exact versions in `package.json` for reproducible sample builds; the install
commands above are what you copy into your own app.

## Samples

- `samples/browser`: framework-free TypeScript app that uses `@faultlenshq/browser` directly.
- `samples/angular`: Angular 21 app that uses `@faultlenshq/angular` and its Angular service/module API.
- `samples/react`: React 19 app that uses `@faultlenshq/react` provider, hook, and error boundary APIs.
- `samples/shared`: runtime config and shared styling used by the sample apps.

## What you need

- Node.js 20+
- npm 10+
- your FaultLens endpoint or tenant host
- your FaultLens project API key

Do not commit real `.env` files, API keys, tenant credentials, names, emails, passwords, tokens, or payment data.

## Environment configuration

Copy the example file when adapting the sample:

```bash
cp .env.example .env
```

The framework-free sample in this repository reads runtime configuration from `window.__FAULTLENS_SAMPLE_CONFIG__`, populated by `public/browser-sample-config.js` locally and by `docker/runtime-config.sh` in containers.

The repository runtime variables are:

```env
FAULTLENS_TENANT_HOST=https://tenant-slug.staging.faultlens.in
FAULTLENS_PROJECT_API_KEY=replace_with_project_api_key
FAULTLENS_ENVIRONMENT=development
FAULTLENS_RELEASE_PREFIX=browser-sample-local
```

`.env.example` also includes Vite-style names for developers copying the browser SDK sample into a Vite app:

```env
VITE_FAULTLENS_API_KEY=replace_with_project_api_key
VITE_FAULTLENS_ENDPOINT=https://api.faultlens.in/api/events/ingest
VITE_FAULTLENS_ENVIRONMENT=development
VITE_FAULTLENS_RELEASE=browser-sample-local
```

If your hosted endpoint differs, replace it with the endpoint or tenant host provided for your FaultLens workspace.

## Browser SDK sample

Run the framework-free browser sample:

```bash
npm install
npm run start:browser
```

Open:

```text
http://localhost:4200
```

Configure:

- endpoint or tenant host
- project API key
- environment
- release prefix

The sample initializes `@faultlenshq/browser@0.1.0-beta.4` with:

- `apiKey`
- `endpoint`
- `environment`
- `release`
- `serviceName = faultlens-browser-sample`
- `serviceVersion = 0.1.0-beta.4`

### Browser demo actions

- **Set anonymous identity**: sets `anon_sample_user`.
- **Set known identity**: sets opaque demo IDs: `user_sample_123`, `acct_sample_123`, and `tenant_sample_123`.
- **Add breadcrumb**: adds a UI click breadcrumb.
- **Simulate route change**: toggles `/dashboard` and `/checkout`, including previous path and route name.
- **Capture message**: sends a manual informational event with tags and context.
- **Capture handled exception**: throws, catches, and captures a deliberate sample error.
- **Capture breadcrumb trail**: adds custom breadcrumbs before capturing an error.
- **Trigger safe network request**: attempts a harmless request without credentials, auth headers, or request body so network breadcrumbs can be inspected.
- **Trigger redaction demo**: sends demo-only sensitive keys such as `token`, `password`, and `apiKey` to show redacted values.

Demo values only. Do not send real secrets, passwords, tokens, payment data, names, or emails.

### What should appear in FaultLens

In the event detail, inspect:

- diagnostic evidence for message and exception events
- breadcrumbs for UI clicks, route changes, custom flow steps, and network breadcrumbs
- route/page context for Dashboard or Checkout and previous path
- tags such as `feature=browser-sdk-sample` and `plan=demo`
- context values such as `sampleApp`, `package`, and demo order/cart IDs
- opaque identity IDs only
- redacted values for sensitive keys

The sample helps investigate frontend errors by showing what safe browser-side evidence can look like. It does not send cookies, local storage, session storage, auth headers, request bodies with sensitive values, or real user personal data.

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
  -e FAULTLENS_ENVIRONMENT=development ^
  -e FAULTLENS_RELEASE_PREFIX=browser-sample-local ^
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

## Privacy guidance

- Use opaque user/account/tenant IDs, not names or email addresses.
- Use demo-only values when testing redaction behavior.
- Do not send real secrets, passwords, tokens, API keys, card data, payment data, or private user content.
- Do not add auth headers or credentialed requests to the network breadcrumb demo.
- Review diagnostic evidence in FaultLens before enabling similar capture in a production app.

## How to verify the event in FaultLens hosted UI

1. Open your tenant workspace.
2. Open the project that matches the API key you used.
3. Open **Events**.
4. Search by release, route, message, or a demo action label from the local event log.
5. Open the event detail and confirm the environment, release, service name, and service version match the sample.
6. Confirm breadcrumbs, route/page context, tags, opaque identity IDs, and redacted values appear as expected.
