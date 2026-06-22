import { FaultLens } from '@faultlenshq/browser';
import { normalizeEnvironment, readRuntimeConfig } from '../../shared/sample-config';

type LogTone = 'info' | 'success' | 'warning' | 'error';

type LogEntry = {
  time: string;
  tone: LogTone;
  title: string;
  detail: string;
};

const packageName = '@faultlenshq/browser';
const packageVersion = '0.1.0-beta.4';
const packageInstall = `npm install ${packageName}@${packageVersion}`;
const serviceName = 'faultlens-browser-sample';
const defaultConfig = readRuntimeConfig();
const logEntries: LogEntry[] = [];

const configForm = requireElement<HTMLFormElement>('[data-config-form]');
const tenantHostInput = requireElement<HTMLInputElement>('[data-tenant-host]');
const projectApiKeyInput = requireElement<HTMLInputElement>('[data-project-api-key]');
const environmentInput = requireElement<HTMLInputElement>('[data-environment]');
const releasePrefixInput = requireElement<HTMLInputElement>('[data-release-prefix]');
const statusApiKey = requireElement<HTMLElement>('[data-status-api-key]');
const statusEndpoint = requireElement<HTMLElement>('[data-status-endpoint]');
const statusEnvironment = requireElement<HTMLElement>('[data-status-environment]');
const statusRelease = requireElement<HTMLElement>('[data-status-release]');
const statusIdentity = requireElement<HTMLElement>('[data-status-identity]');
const statusRoute = requireElement<HTMLElement>('[data-status-route]');
const logList = requireElement<HTMLElement>('[data-event-log]');
const actionButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-action]'));

let currentRelease = '';
let currentRoute = '/dashboard';
let previousRoute = '';
let identityMode = 'not set';

document.querySelectorAll<HTMLElement>('[data-package-name]').forEach((element) => {
  element.textContent = packageName;
});
document.querySelectorAll<HTMLElement>('[data-package-version]').forEach((element) => {
  element.textContent = packageVersion;
});
document.querySelectorAll<HTMLElement>('[data-package-install]').forEach((element) => {
  element.textContent = packageInstall;
});

tenantHostInput.value = defaultConfig.tenantHost;
projectApiKeyInput.value = defaultConfig.projectApiKey;
environmentInput.value = defaultConfig.environment;
releasePrefixInput.value = defaultConfig.releasePrefix;

initializeSdk();
renderStatus();
pushLog('info', 'Sample loaded', 'Configure your endpoint and project API key, then run the demo actions.');

configForm.addEventListener('submit', (event) => {
  event.preventDefault();
  initializeSdk();
  pushLog('success', 'SDK initialized', `Using ${currentRelease} for ${normalizedEndpoint() || 'the configured endpoint'}.`);
});

[tenantHostInput, projectApiKeyInput, environmentInput, releasePrefixInput].forEach((input) => {
  input.addEventListener('input', () => {
    if (input === environmentInput) {
      environmentInput.value = normalizeEnvironment(environmentInput.value);
    }

    renderStatus();
  });
});

actionButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const action = button.dataset['action'];

    if (action === 'anonymous') setAnonymousIdentity();
    if (action === 'known') setKnownIdentity();
    if (action === 'breadcrumb') addUiBreadcrumb();
    if (action === 'route') simulateRouteChange();
    if (action === 'message') captureMessage();
    if (action === 'exception') captureHandledException();
    if (action === 'trail') captureBreadcrumbTrail();
    if (action === 'network') triggerSafeNetworkRequest();
    if (action === 'redaction') triggerRedactionDemo();
  });
});

function initializeSdk(): boolean {
  const apiKey = projectApiKeyInput.value.trim();
  const endpoint = normalizedEndpoint();
  const environment = normalizeEnvironment(environmentInput.value);
  const releasePrefix = releasePrefixInput.value.trim() || 'browser-sample-local';

  currentRelease = `${releasePrefix}-${packageVersion}`;
  renderStatus();

  if (!apiKey || !endpoint) {
    return false;
  }

  FaultLens.init({
    apiKey,
    endpoint,
    environment,
    release: currentRelease,
    serviceName,
    serviceVersion: packageVersion,
    captureConsoleBreadcrumbs: true,
    captureNetworkBreadcrumbs: true,
    capturePageContext: true
  }, {
    debug: true
  });

  FaultLens.setTags({
    feature: 'browser-sdk-sample',
    plan: 'demo'
  });
  FaultLens.setContext('sample', {
    sampleApp: serviceName,
    package: packageName,
    packageVersion,
    demoOnly: true
  });
  FaultLens.setRoute({
    name: routeName(currentRoute),
    path: currentRoute,
    previousPath: previousRoute || undefined
  });

  return true;
}

function setAnonymousIdentity(): void {
  if (!requireSdk('Set anonymous identity')) return;

  FaultLens.setAnonymousId('anon_sample_user');
  identityMode = 'anonymous opaque ID';
  renderStatus();
  pushLog('success', 'Anonymous identity set', 'Set anon_sample_user. Use opaque demo IDs, not names or emails.');
}

function setKnownIdentity(): void {
  if (!requireSdk('Set known identity')) return;

  FaultLens.identify({
    userId: 'user_sample_123',
    accountId: 'acct_sample_123',
    tenantId: 'tenant_sample_123'
  });
  identityMode = 'known opaque IDs';
  renderStatus();
  pushLog('success', 'Known identity set', 'Set demo-only user/account/tenant IDs with no personal data.');
}

function addUiBreadcrumb(): void {
  if (!requireSdk('Add UI breadcrumb')) return;

  FaultLens.addBreadcrumb({
    category: 'ui.click',
    type: 'user',
    level: 'info',
    message: 'Clicked Add breadcrumb in the browser SDK sample',
    data: {
      control: 'add-breadcrumb',
      sampleOnly: true
    }
  });
  pushLog('success', 'Breadcrumb added', 'A UI click breadcrumb will be attached to the next captured event.');
}

function simulateRouteChange(): void {
  if (!requireSdk('Simulate route change')) return;

  previousRoute = currentRoute;
  currentRoute = currentRoute === '/dashboard' ? '/checkout' : '/dashboard';

  FaultLens.addBreadcrumb({
    category: 'navigation',
    type: 'navigation',
    level: 'info',
    message: `Route changed from ${previousRoute} to ${currentRoute}`,
    data: {
      from: previousRoute,
      to: currentRoute
    }
  });
  FaultLens.setRoute({
    name: routeName(currentRoute),
    path: currentRoute,
    previousPath: previousRoute
  });

  renderStatus();
  pushLog('success', 'Route/page context updated', `Current route is ${currentRoute}; previous path is ${previousRoute}.`);
}

function captureMessage(): void {
  if (!requireSdk('Capture message')) return;

  FaultLens.captureMessage('FaultLens browser sample message', {
    level: 'info',
    tags: {
      action: 'capture-message'
    },
    context: {
      demoAction: 'manual-message',
      safeOrderId: 'order_demo_123'
    }
  });
  pushLog('success', 'Message captured', 'Submitted an informational message with demo tags and context.');
}

function captureHandledException(): void {
  if (!requireSdk('Capture handled exception')) return;

  try {
    throw new Error('FaultLens browser sample handled exception');
  } catch (error) {
    FaultLens.captureException(error, {
      tags: {
        action: 'handled-exception'
      },
      context: {
        demoAction: 'throw-catch-capture',
        safeCartId: 'cart_demo_456'
      },
      fingerprint: 'browser-sample-handled-exception'
    });
    pushLog('success', 'Handled exception captured', 'Threw, caught, and captured a deliberate sample error.');
  }
}

function captureBreadcrumbTrail(): void {
  if (!requireSdk('Capture breadcrumb trail')) return;

  FaultLens.addBreadcrumb({
    category: 'sample.flow',
    type: 'debug',
    level: 'info',
    message: 'Started checkout validation demo',
    data: { step: 1, safeOrderId: 'order_demo_789' }
  });
  FaultLens.addBreadcrumb({
    category: 'sample.flow',
    type: 'debug',
    level: 'warning',
    message: 'Detected sample-only validation failure',
    data: { step: 2, field: 'demo-discount-code' }
  });
  FaultLens.captureException(new Error('FaultLens browser sample breadcrumb trail error'), {
    tags: {
      action: 'breadcrumb-trail'
    },
    context: {
      demoAction: 'breadcrumb-trail-before-error',
      safeOrderId: 'order_demo_789'
    },
    fingerprint: 'browser-sample-breadcrumb-trail'
  });
  pushLog('success', 'Breadcrumb trail captured', 'Submitted an error after adding a short diagnostic breadcrumb trail.');
}

async function triggerSafeNetworkRequest(): Promise<void> {
  if (!requireSdk('Trigger safe network request')) return;

  try {
    await fetch('https://example.invalid/faultlens-network-demo?token=demo-token', {
      method: 'GET',
      credentials: 'omit',
      cache: 'no-store'
    });
  } catch {
    FaultLens.captureMessage('FaultLens browser sample network breadcrumb demo', {
      level: 'warning',
      tags: {
        action: 'network-breadcrumb'
      },
      context: {
        demoAction: 'safe-network-request',
        expectedResult: 'request may fail locally; metadata is useful as a breadcrumb'
      }
    });
    pushLog('warning', 'Network breadcrumb demo submitted', 'A harmless request was attempted without credentials or request body.');
  }
}

function triggerRedactionDemo(): void {
  if (!requireSdk('Trigger redaction demo')) return;

  FaultLens.setContext('redactionDemo', {
    safeOrderId: 'order_demo_123',
    token: 'demo-token-that-should-be-filtered',
    password: 'demo-password-that-should-be-filtered',
    apiKey: 'demo-api-key-that-should-be-filtered'
  });
  FaultLens.captureMessage('FaultLens browser sample redaction demo', {
    level: 'info',
    tags: {
      action: 'redaction-demo'
    },
    context: {
      safeNote: 'Demo values only. Do not send real secrets.',
      token: 'demo-token-that-should-be-filtered'
    }
  });
  pushLog('success', 'Redaction demo submitted', 'Demo values only. Do not send real secrets.');
}

function requireSdk(action: string): boolean {
  if (FaultLens.getCurrent()) {
    return true;
  }

  if (initializeSdk() && FaultLens.getCurrent()) {
    return true;
  }

  pushLog('error', `${action} blocked`, 'Configure an endpoint and project API key before sending SDK events.');
  return false;
}

function renderStatus(): void {
  const endpoint = normalizedEndpoint();
  const environment = normalizeEnvironment(environmentInput.value);
  const releasePrefix = releasePrefixInput.value.trim() || 'browser-sample-local';
  const release = currentRelease || `${releasePrefix}-${packageVersion}`;

  statusApiKey.textContent = projectApiKeyInput.value.trim() ? 'configured' : 'missing';
  statusApiKey.className = projectApiKeyInput.value.trim() ? 'status-good' : 'status-missing';
  statusEndpoint.textContent = endpoint ? 'configured' : 'missing';
  statusEndpoint.className = endpoint ? 'status-good' : 'status-missing';
  statusEnvironment.textContent = environment;
  statusRelease.textContent = release;
  statusIdentity.textContent = identityMode;
  statusRoute.textContent = `${routeName(currentRoute)} (${currentRoute})`;
}

function pushLog(tone: LogTone, title: string, detail: string): void {
  logEntries.unshift({
    time: new Date().toLocaleTimeString(),
    tone,
    title,
    detail
  });
  logEntries.splice(8);
  renderLog();
}

function renderLog(): void {
  logList.innerHTML = logEntries.map((entry) => `
    <li class="log-entry ${entry.tone}">
      <span>${entry.time}</span>
      <strong>${entry.title}</strong>
      <p>${entry.detail}</p>
    </li>
  `).join('');
}

function normalizedEndpoint(): string {
  const trimmed = tenantHostInput.value.trim();
  if (!trimmed) return '';

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.replace(/\/+$/, '');
}

function routeName(path: string): string {
  return path === '/checkout' ? 'Checkout' : 'Dashboard';
}

function requireElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }

  return element;
}
