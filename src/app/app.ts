import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FaultLens } from '@faultlenshq/browser';

declare global {
  interface Window {
    __FAULTLENS_SAMPLE_CONFIG__?: Partial<SampleFormState>;
  }
}

type SampleFormState = {
  tenantHost: string;
  projectApiKey: string;
  environment: FaultLensEnvironment;
  releasePrefix: string;
};

type FaultLensEnvironment = 'staging' | 'production' | 'development';

type SendState = {
  tone: 'idle' | 'pending' | 'success' | 'error';
  title: string;
  detail: string;
};

const defaultConfig = readRuntimeConfig();

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly packageName = '@faultlenshq/browser';
  protected readonly packageInstall = 'npm install @faultlenshq/browser@beta';
  protected readonly environment = signal(defaultConfig.environment);
  protected readonly releasePrefix = signal(defaultConfig.releasePrefix);
  protected readonly projectApiKey = signal(defaultConfig.projectApiKey);
  protected readonly tenantHost = signal(defaultConfig.tenantHost);
  protected readonly lastSmokeId = signal('');
  protected readonly lastRelease = signal('');
  protected readonly sendState = signal<SendState>({
    tone: 'idle',
    title: 'Ready',
    detail: 'Enter your tenant host and project API key, then send a smoke event.'
  });
  protected readonly canSend = computed(() =>
    Boolean(this.normalizedTenantHost()) &&
    Boolean(this.projectApiKey().trim()) &&
    Boolean(this.environment().trim()) &&
    this.sendState().tone !== 'pending'
  );

  protected async sendSmokeEvent(): Promise<void> {
    const tenantHost = this.normalizedTenantHost();
    const projectApiKey = this.projectApiKey().trim();
    const environment = normalizeEnvironment(this.environment());
    const releasePrefix = this.releasePrefix().trim() || 'frontend-sample';

    if (!tenantHost || !projectApiKey) {
      this.sendState.set({
        tone: 'error',
        title: 'Missing configuration',
        detail: 'Provide both a tenant host and a project API key before sending a smoke event.'
      });
      return;
    }

    const smokeId = createSmokeId();
    const release = `${releasePrefix}-${smokeId}`;
    const message = `FaultLens frontend sample smoke ${smokeId}`;

    this.lastSmokeId.set(smokeId);
    this.lastRelease.set(release);
    this.sendState.set({
      tone: 'pending',
      title: 'Sending event',
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
        sampleApp: 'faultlens-frontend-samples',
        smokeId,
        package: this.packageName
      });

      sdk.addBreadcrumb({
        category: 'sample',
        message: `Preparing browser smoke ${smokeId}`,
        data: {
          smokeId,
          release
        }
      });

      await this.captureDeliveryResult(tenantHost, () => {
        sdk.captureError(new Error(message), {
          smokeId,
          release,
          sample: 'faultlens-frontend-samples'
        });
      });
    } catch (error) {
      this.sendState.set({
        tone: 'error',
        title: 'Sample failed before send',
        detail: error instanceof Error ? error.message : 'Unexpected browser SDK setup error.'
      });
    }
  }

  protected applyTenantHost(value: string): void {
    this.tenantHost.set(value);
  }

  protected applyProjectApiKey(value: string): void {
    this.projectApiKey.set(value);
  }

  protected applyEnvironment(value: string): void {
    this.environment.set(normalizeEnvironment(value));
  }

  protected applyReleasePrefix(value: string): void {
    this.releasePrefix.set(value);
  }

  protected normalizedTenantHost(): string {
    return normalizeTenantHost(this.tenantHost());
  }

  private async captureDeliveryResult(tenantHost: string, triggerSend: () => void): Promise<void> {
    const originalFetch = globalThis.fetch?.bind(globalThis);
    if (!originalFetch) {
      this.sendState.set({
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
        if (resolved) {
          return;
        }

        resolved = true;
        restore();
        this.sendState.set({
          tone: 'success',
          title: 'Request submitted',
          detail: `The browser SDK issued the ingest request. Check FaultLens Events using smoke ID ${this.lastSmokeId()}.`
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

          this.sendState.set(response.ok ? {
            tone: 'success',
            title: 'Delivered',
            detail: `FaultLens accepted smoke ID ${this.lastSmokeId()} for release ${this.lastRelease()}. Verify it in your project Events view.`
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
          this.sendState.set({
            tone: 'error',
            title: 'Send failed',
            detail: error instanceof Error ? error.message : 'Unexpected browser SDK error.'
          });
          resolve();
        }
      }
    });
  }
}

function readRuntimeConfig(): SampleFormState {
  const runtime = window.__FAULTLENS_SAMPLE_CONFIG__ ?? {};

  return {
    tenantHost: runtime.tenantHost?.trim() ?? '',
    projectApiKey: runtime.projectApiKey?.trim() ?? '',
    environment: normalizeEnvironment(runtime.environment),
    releasePrefix: runtime.releasePrefix?.trim() ?? 'frontend-sample'
  };
}

function normalizeTenantHost(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.replace(/\/+$/, '');
}

function createSmokeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().slice(0, 8);
  }

  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function normalizeEnvironment(value: string | undefined): FaultLensEnvironment {
  const normalized = value?.trim().toLowerCase();

  if (normalized === 'production' || normalized === 'development') {
    return normalized;
  }

  return 'staging';
}
