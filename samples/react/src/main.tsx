import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ErrorBoundary,
  FaultLensProvider,
  useFaultLens,
  type FaultLensErrorBoundaryFallbackProps
} from '@faultlenshq/react';
import { normalizeEnvironment, readRuntimeConfig, type FaultLensEnvironment } from '../../shared/sample-config';

type SendTone = 'idle' | 'pending' | 'success' | 'error';

type SendState = {
  tone: SendTone;
  title: string;
  detail: string;
};

type FormState = {
  tenantHost: string;
  projectApiKey: string;
  environment: FaultLensEnvironment;
  releasePrefix: string;
};

const packageName = '@faultlenshq/react';
const packageInstall = 'npm install @faultlenshq/react@0.1.0-beta.1 @faultlenshq/browser@0.1.0-beta.3 react react-dom';
const defaultConfig = readRuntimeConfig();

function App(): React.ReactElement {
  const [formState, setFormState] = useState<FormState>(defaultConfig);
  const [lastSmokeId, setLastSmokeId] = useState('');
  const [lastRelease, setLastRelease] = useState('');
  const [sendState, setSendState] = useState<SendState>({
    tone: 'idle',
    title: 'Ready',
    detail: 'Enter your tenant host and project API key, then send a React smoke event.'
  });
  const [boundaryKey, setBoundaryKey] = useState(0);
  const [shouldThrow, setShouldThrow] = useState(false);

  const tenantHost = normalizeTenantHost(formState.tenantHost);
  const enabled = Boolean(tenantHost && formState.projectApiKey.trim());

  const providerRelease = useMemo(() => {
    const releasePrefix = formState.releasePrefix.trim() || 'frontend-sample';
    return `${releasePrefix}-react-preview`;
  }, [formState.releasePrefix]);

  return (
    <FaultLensProvider
      apiKey={formState.projectApiKey.trim()}
      projectId="configured-by-api-key"
      environment={formState.environment}
      endpoint={tenantHost || 'https://example.invalid'}
      platform="react"
      release={providerRelease}
      enabled={enabled}
      options={{ debug: true }}
    >
      <ReactSample
        formState={formState}
        tenantHost={tenantHost}
        lastSmokeId={lastSmokeId}
        lastRelease={lastRelease}
        sendState={sendState}
        canSend={enabled && sendState.tone !== 'pending'}
        boundaryKey={boundaryKey}
        shouldThrow={shouldThrow}
        setFormState={setFormState}
        setLastSmokeId={setLastSmokeId}
        setLastRelease={setLastRelease}
        setSendState={setSendState}
        resetBoundary={() => {
          setShouldThrow(false);
          setBoundaryKey((value) => value + 1);
        }}
        triggerBoundaryError={() => setShouldThrow(true)}
      />
    </FaultLensProvider>
  );
}

type ReactSampleProps = {
  formState: FormState;
  tenantHost: string;
  lastSmokeId: string;
  lastRelease: string;
  sendState: SendState;
  canSend: boolean;
  boundaryKey: number;
  shouldThrow: boolean;
  setFormState: React.Dispatch<React.SetStateAction<FormState>>;
  setLastSmokeId: React.Dispatch<React.SetStateAction<string>>;
  setLastRelease: React.Dispatch<React.SetStateAction<string>>;
  setSendState: React.Dispatch<React.SetStateAction<SendState>>;
  resetBoundary: () => void;
  triggerBoundaryError: () => void;
};

function ReactSample(props: ReactSampleProps): React.ReactElement {
  const faultLens = useFaultLens();

  async function sendSmoke(kind: 'message' | 'exception' | 'boundary'): Promise<void> {
    const projectApiKey = props.formState.projectApiKey.trim();
    const releasePrefix = props.formState.releasePrefix.trim() || 'frontend-sample';

    if (!props.tenantHost || !projectApiKey) {
      props.setSendState({
        tone: 'error',
        title: 'Missing configuration',
        detail: 'Provide both a tenant host and a project API key before sending a React smoke event.'
      });
      return;
    }

    const smokeId = createSmokeId();
    const release = `${releasePrefix}-react-${smokeId}`;

    props.setLastSmokeId(smokeId);
    props.setLastRelease(release);
    props.setSendState({
      tone: 'pending',
      title: 'Sending React event',
      detail: `Submitting smoke ID ${smokeId} to ${props.tenantHost}/api/events/ingest...`
    });

    try {
      faultLens.setContext({
        sampleApp: 'faultlens-react-sample',
        smokeId,
        package: packageName,
        mode: 'react'
      });
      faultLens.setUserId('react-demo-user');
      faultLens.setTag('sample', 'react');
      faultLens.setTags({
        feature: 'react-native',
        flow: 'manual-smoke-test'
      });
      faultLens.addBreadcrumb({
        category: 'sample.react',
        message: `Preparing React ${kind} smoke ${smokeId}`,
        data: { smokeId, release, kind }
      });

      await captureDeliveryResult(props.tenantHost, props.setSendState, smokeId, release, () => {
        if (kind === 'message') {
          faultLens.captureMessage(`FaultLens React sample message ${smokeId}`, {
            smokeId,
            release,
            sample: 'faultlens-react-sample',
            kind,
            diagnosticsUserId: 'react-demo-user'
          });
          return;
        }

        if (kind === 'exception') {
          faultLens.captureException(new Error(`FaultLens React sample exception ${smokeId}`), {
            smokeId,
            release,
            sample: 'faultlens-react-sample',
            kind,
            diagnosticsUserId: 'react-demo-user'
          });
          return;
        }

        props.resetBoundary();
        window.setTimeout(props.triggerBoundaryError, 0);
      });
    } catch (error) {
      props.setSendState({
        tone: 'error',
        title: 'React sample failed before send',
        detail: error instanceof Error ? error.message : 'Unexpected React SDK setup error.'
      });
    }
  }

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">FaultLens React Sample</p>
        <h1>Test @faultlenshq/react against your own FaultLens workspace.</h1>
        <p className="lede">
          This React 19 sample uses <code>{packageName}</code> with the provider, hook, and error boundary APIs.
          It reuses the same runtime configuration contract as the browser and Angular samples.
        </p>
      </section>

      <section className="workspace">
        <form className="config-panel" onSubmit={(event) => {
          event.preventDefault();
          void sendSmoke('message');
        }}>
          <p className="panel-label">React SDK</p>
          <div className="field">
            <label htmlFor="tenant-host">Tenant host</label>
            <input
              id="tenant-host"
              name="tenant-host"
              type="url"
              value={props.formState.tenantHost}
              onChange={(event) => props.setFormState((state) => ({ ...state, tenantHost: event.target.value }))}
              placeholder="https://tenant-slug.staging.faultlens.in"
              autoComplete="off"
            />
            <p className="hint">Use your tenant workspace host, not the shared app host.</p>
          </div>

          <div className="field">
            <label htmlFor="project-api-key">Project API key</label>
            <input
              id="project-api-key"
              name="project-api-key"
              type="password"
              value={props.formState.projectApiKey}
              onChange={(event) => props.setFormState((state) => ({ ...state, projectApiKey: event.target.value }))}
              placeholder="Paste the project ingest key"
              autoComplete="off"
            />
            <p className="hint">Get this from the project setup panel or project overview in FaultLens.</p>
          </div>

          <div className="grid">
            <div className="field">
              <label htmlFor="environment">Environment</label>
              <input
                id="environment"
                name="environment"
                type="text"
                value={props.formState.environment}
                onChange={(event) => props.setFormState((state) => ({
                  ...state,
                  environment: normalizeEnvironment(event.target.value)
                }))}
                placeholder="staging"
              />
            </div>

            <div className="field">
              <label htmlFor="release-prefix">Release prefix</label>
              <input
                id="release-prefix"
                name="release-prefix"
                type="text"
                value={props.formState.releasePrefix}
                onChange={(event) => props.setFormState((state) => ({ ...state, releasePrefix: event.target.value }))}
                placeholder="frontend-sample"
              />
            </div>
          </div>

          <div className="button-row">
            <button className="primary" type="submit" disabled={!props.canSend}>
              {props.sendState.tone === 'pending' ? 'Sending...' : 'Send React message'}
            </button>
            <button className="secondary" type="button" disabled={!props.canSend} onClick={() => void sendSmoke('exception')}>
              Send React exception
            </button>
            <button className="secondary" type="button" disabled={!props.canSend} onClick={() => void sendSmoke('boundary')}>
              Trigger boundary error
            </button>
          </div>

          <ErrorBoundary
            key={props.boundaryKey}
            fallback={(fallbackProps: FaultLensErrorBoundaryFallbackProps) => (
              <div className="fallback">
                <p>React error boundary captured: <code>{fallbackProps.error.message}</code></p>
                <button className="secondary" type="button" onClick={() => {
                  fallbackProps.resetError();
                  props.resetBoundary();
                }}>
                  Reset boundary
                </button>
              </div>
            )}
          >
            <BoundaryProbe shouldThrow={props.shouldThrow} />
          </ErrorBoundary>
        </form>

        <section className={`status-panel ${props.sendState.tone === 'idle' ? '' : props.sendState.tone}`}>
          <p className="status-label">Status</p>
          <h2>{props.sendState.title}</h2>
          <p>{props.sendState.detail}</p>

          <dl className="status-meta">
            <div>
              <dt>Package</dt>
              <dd>{packageName}</dd>
            </div>
            <div>
              <dt>Install</dt>
              <dd><code>{packageInstall}</code></dd>
            </div>
            <div>
              <dt>Endpoint</dt>
              <dd><code>{props.tenantHost || 'Configure a tenant host'}</code></dd>
            </div>
            <div>
              <dt>Latest smoke ID</dt>
              <dd><code>{props.lastSmokeId || 'Not sent yet'}</code></dd>
            </div>
            <div>
              <dt>Latest release</dt>
              <dd><code>{props.lastRelease || 'Not sent yet'}</code></dd>
            </div>
            <div>
              <dt>Diagnostics</dt>
              <dd><code>react-demo-user / sample=react</code></dd>
            </div>
          </dl>
        </section>
      </section>

      <section className="verification">
        <h3>Hosted verification</h3>
        <ol>
          <li>Open your tenant workspace in FaultLens.</li>
          <li>Open the project that matches the project API key you used.</li>
          <li>Open <strong>Events</strong> and search for the smoke ID or release shown above.</li>
          <li>Confirm diagnostics context includes requested URL, browser user agent, <code>userId = react-demo-user</code>, and React sample tags.</li>
        </ol>
      </section>
    </main>
  );
}

function BoundaryProbe({ shouldThrow }: { shouldThrow: boolean }): React.ReactElement {
  if (shouldThrow) {
    throw new Error('FaultLens React sample render failure');
  }

  return <p className="hint">The boundary path is ready. Trigger it to validate render-error capture.</p>;
}

async function captureDeliveryResult(
  tenantHost: string,
  setSendState: React.Dispatch<React.SetStateAction<SendState>>,
  smokeId: string,
  release: string,
  triggerSend: () => void
): Promise<void> {
  const originalFetch = globalThis.fetch?.bind(globalThis);
  if (!originalFetch) {
    setSendState({
      tone: 'error',
      title: 'Browser fetch unavailable',
      detail: 'This browser runtime does not expose fetch, so the sample cannot verify delivery.'
    });
    return;
  }

  const ingestUrl = `${tenantHost}/api/events/ingest`;
  let resolved = false;

  await new Promise<void>((resolve) => {
    const restore = () => {
      globalThis.fetch = originalFetch;
    };

    const timeoutId = window.setTimeout(() => {
      if (resolved) return;

      resolved = true;
      restore();
      setSendState({
        tone: 'success',
        title: 'Request submitted',
        detail: `The React SDK issued the ingest request. Check FaultLens Events using smoke ID ${smokeId}.`
      });
      resolve();
    }, 6000);

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const requestUrl = typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

      const response = await originalFetch(input, init);

      if (!resolved && requestUrl === ingestUrl) {
        resolved = true;
        window.clearTimeout(timeoutId);
        restore();

        setSendState(response.ok ? {
          tone: 'success',
          title: 'Delivered',
          detail: `FaultLens accepted smoke ID ${smokeId} for release ${release}. Verify it in your project Events view.`
        } : {
          tone: 'error',
          title: `Delivery failed (${response.status})`,
          detail: `The ingest endpoint responded with ${response.status} ${response.statusText}. Double-check the tenant host and project API key.`
        });

        resolve();
      }

      return response;
    };

    try {
      triggerSend();
    } catch (error) {
      if (!resolved) {
        resolved = true;
        window.clearTimeout(timeoutId);
        restore();
        setSendState({
          tone: 'error',
          title: 'Send failed',
          detail: error instanceof Error ? error.message : 'Unexpected React SDK error.'
        });
        resolve();
      }
    }
  });
}

function normalizeTenantHost(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.replace(/\/+$/, '');
}

function createSmokeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().slice(0, 8);
  }

  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Missing React root element.');
}

createRoot(rootElement).render(<App />);
