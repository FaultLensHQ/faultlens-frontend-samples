import { FaultLens } from '@faultlenshq/browser';
import { normalizeEnvironment, readRuntimeConfig } from '../../shared/sample-config';

type SendTone = 'idle' | 'pending' | 'success' | 'error';

type SendState = {
  tone: SendTone;
  title: string;
  detail: string;
};

const packageName = '@faultlenshq/browser';
const packageInstall = 'npm install @faultlenshq/browser@0.1.0-beta.3';
const defaultConfig = readRuntimeConfig();

const form = requireElement<HTMLFormElement>('[data-smoke-form]');
const tenantHostInput = requireElement<HTMLInputElement>('[data-tenant-host]');
const projectApiKeyInput = requireElement<HTMLInputElement>('[data-project-api-key]');
const environmentInput = requireElement<HTMLInputElement>('[data-environment]');
const releasePrefixInput = requireElement<HTMLInputElement>('[data-release-prefix]');
const sendButton = requireElement<HTMLButtonElement>('[data-send-button]');
const statusPanel = requireElement<HTMLElement>('[data-status-panel]');
const statusTitle = requireElement<HTMLElement>('[data-status-title]');
const statusDetail = requireElement<HTMLElement>('[data-status-detail]');
const endpoint = requireElement<HTMLElement>('[data-endpoint]');
const smokeIdElement = requireElement<HTMLElement>('[data-smoke-id]');
const releaseElement = requireElement<HTMLElement>('[data-release]');
const packageInstallElement = requireElement<HTMLElement>('[data-package-install]');

document.querySelectorAll<HTMLElement>('[data-package-name]').forEach((element) => {
  element.textContent = packageName;
});
packageInstallElement.textContent = packageInstall;

tenantHostInput.value = defaultConfig.tenantHost;
projectApiKeyInput.value = defaultConfig.projectApiKey;
environmentInput.value = defaultConfig.environment;
releasePrefixInput.value = defaultConfig.releasePrefix;

updateCanSend();
updateEndpoint();

form.addEventListener('submit', (event) => {
  event.preventDefault();
  void sendSmokeEvent();
});

[tenantHostInput, projectApiKeyInput, environmentInput, releasePrefixInput].forEach((input) => {
  input.addEventListener('input', () => {
    if (input === environmentInput) {
      environmentInput.value = normalizeEnvironment(environmentInput.value);
    }

    updateCanSend();
    updateEndpoint();
  });
});

async function sendSmokeEvent(): Promise<void> {
  const tenantHost = normalizedTenantHost();
  const projectApiKey = projectApiKeyInput.value.trim();
  const environment = normalizeEnvironment(environmentInput.value);
  const releasePrefix = releasePrefixInput.value.trim() || 'frontend-sample';

  if (!tenantHost || !projectApiKey) {
    setState({
      tone: 'error',
      title: 'Missing configuration',
      detail: 'Provide both a tenant host and a project API key before sending a smoke event.'
    });
    return;
  }

  const smokeId = createSmokeId();
  const release = `${releasePrefix}-browser-${smokeId}`;
  const message = `FaultLens browser SDK sample smoke ${smokeId}`;

  smokeIdElement.textContent = smokeId;
  releaseElement.textContent = release;
  setState({
    tone: 'pending',
    title: 'Sending browser SDK event',
    detail: `Submitting smoke ID ${smokeId} to ${tenantHost}/api/events/ingest...`
  });

  try {
    const sdk = new FaultLens({
      apiKey: projectApiKey,
      projectId: 'configured-by-api-key',
      environment,
      endpoint: tenantHost,
      platform: 'browser',
      release
    }, {
      debug: true
    });

    sdk.setContext({
      sampleApp: 'faultlens-browser-sample',
      smokeId,
      package: packageName
    });
    sdk.setUserId('local-browser-demo-user');
    sdk.setTag('sample', 'frontend');
    sdk.setTags({
      feature: 'diagnostics-context',
      flow: 'manual-smoke-test'
    });
    sdk.addBreadcrumb({
      category: 'sample.browser',
      message: `Preparing browser SDK smoke ${smokeId}`,
      data: { smokeId, release }
    });

    await captureDeliveryResult(smokeId, release, () => {
      sdk.captureError(new Error(message), {
        smokeId,
        release,
        sample: 'faultlens-browser-sample',
        diagnosticsUserId: 'local-browser-demo-user'
      });
    });
  } catch (error) {
    setState({
      tone: 'error',
      title: 'Sample failed before send',
      detail: error instanceof Error ? error.message : 'Unexpected browser SDK setup error.'
    });
  }
}

async function captureDeliveryResult(
  smokeId: string,
  release: string,
  triggerSend: () => void
): Promise<void> {
  const tenantHost = normalizedTenantHost();
  const originalFetch = globalThis.fetch?.bind(globalThis);
  if (!originalFetch) {
    setState({
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
      setState({
        tone: 'success',
        title: 'Request submitted',
        detail: `The SDK issued the ingest request. Check FaultLens Events using smoke ID ${smokeId}.`
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

        setState(response.ok ? {
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
        setState({
          tone: 'error',
          title: 'Send failed',
          detail: error instanceof Error ? error.message : 'Unexpected browser SDK error.'
        });
        resolve();
      }
    }
  });
}

function setState(state: SendState): void {
  statusPanel.classList.remove('pending', 'success', 'error');
  if (state.tone !== 'idle') {
    statusPanel.classList.add(state.tone);
  }

  statusTitle.textContent = state.title;
  statusDetail.textContent = state.detail;
  sendButton.disabled = state.tone === 'pending' || !canSend();
  sendButton.textContent = state.tone === 'pending' ? 'Sending smoke event...' : 'Send test error';
}

function updateCanSend(): void {
  sendButton.disabled = !canSend();
}

function updateEndpoint(): void {
  endpoint.textContent = normalizedTenantHost() || 'Configure a tenant host';
}

function canSend(): boolean {
  return Boolean(normalizedTenantHost()) &&
    Boolean(projectApiKeyInput.value.trim()) &&
    Boolean(environmentInput.value.trim());
}

function normalizedTenantHost(): string {
  const trimmed = tenantHostInput.value.trim();
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

function requireElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }

  return element;
}
