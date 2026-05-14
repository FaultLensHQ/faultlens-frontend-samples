import { CommonModule } from '@angular/common';
import {
  Component,
  EnvironmentInjector,
  WritableSignal,
  computed,
  createEnvironmentInjector,
  importProvidersFrom,
  inject,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FaultLensModule, FaultLensService } from '@faultlenshq/angular';
import { FaultLensConfig } from '@faultlenshq/browser';
import { normalizeEnvironment, readRuntimeConfig } from '../../../shared/sample-config';

type SendState = {
  tone: 'idle' | 'pending' | 'success' | 'error';
  title: string;
  detail: string;
};

const defaultConfig = readRuntimeConfig();

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './angular-sample.html',
  styleUrl: '../../../shared/sample-page.scss'
})
export class AngularSample {
  private readonly environmentInjector = inject(EnvironmentInjector);
  protected readonly packageName = '@faultlenshq/angular';
  protected readonly packageInstall = 'npm install @faultlenshq/angular@0.1.0-beta.2 @faultlenshq/browser@0.1.0-beta.3';
  protected readonly environment = signal(defaultConfig.environment);
  protected readonly releasePrefix = signal(defaultConfig.releasePrefix);
  protected readonly projectApiKey = signal(defaultConfig.projectApiKey);
  protected readonly tenantHost = signal(defaultConfig.tenantHost);
  protected readonly lastSmokeId = signal('');
  protected readonly lastRelease = signal('');
  protected readonly sendState = signal<SendState>({
    tone: 'idle',
    title: 'Ready',
    detail: 'Enter your tenant host and project API key, then send an Angular-native smoke event.'
  });
  protected readonly canSend = computed(() =>
    Boolean(this.normalizedTenantHost()) &&
    Boolean(this.projectApiKey().trim()) &&
    Boolean(this.environment().trim()) &&
    this.sendState().tone !== 'pending'
  );

  protected async sendMessage(): Promise<void> {
    await this.sendSmoke('message');
  }

  protected async sendException(): Promise<void> {
    await this.sendSmoke('exception');
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

  private async sendSmoke(kind: 'message' | 'exception'): Promise<void> {
    const tenantHost = this.normalizedTenantHost();
    const projectApiKey = this.projectApiKey().trim();
    const environment = normalizeEnvironment(this.environment());
    const releasePrefix = this.releasePrefix().trim() || 'frontend-sample';

    if (!tenantHost || !projectApiKey) {
      this.sendState.set({
        tone: 'error',
        title: 'Missing configuration',
        detail: 'Provide both a tenant host and a project API key before sending an Angular-native smoke event.'
      });
      return;
    }

    const smokeId = createSmokeId();
    const release = `${releasePrefix}-angular-${smokeId}`;
    const message = kind === 'message'
      ? `FaultLens Angular-native sample message ${smokeId}`
      : `FaultLens Angular-native sample exception ${smokeId}`;

    this.lastSmokeId.set(smokeId);
    this.lastRelease.set(release);
    this.sendState.set({
      tone: 'pending',
      title: 'Sending Angular-native event',
      detail: `Submitting smoke ID ${smokeId} to ${tenantHost}/api/events/ingest...`
    });

    try {
      const faultLens = this.createFaultLensService({
        apiKey: projectApiKey,
        projectId: 'configured-by-api-key',
        environment,
        endpoint: tenantHost,
        platform: 'angular',
        release
      });

      faultLens.setContext({
        sampleApp: 'faultlens-angular-sample',
        smokeId,
        package: this.packageName,
        mode: 'angular-native'
      });
      faultLens.setUserId('angular-demo-user');
      faultLens.setTag('sample', 'angular');
      faultLens.setTags({
        feature: 'angular-native',
        flow: 'manual-smoke-test'
      });
      faultLens.addBreadcrumb({
        category: 'sample.angular',
        message: `Preparing Angular-native ${kind} smoke ${smokeId}`,
        data: { smokeId, release, kind }
      });

      await this.captureDeliveryResult(this.sendState, smokeId, release, () => {
        const error = kind === 'message'
          ? new Error(message)
          : new Error(`${message}: simulated component failure`);

        if (kind === 'message') {
          error.name = 'Message';
        }

        faultLens.captureError(error, {
          smokeId,
          release,
          sample: 'faultlens-angular-sample',
          mode: 'angular-native',
          kind,
          diagnosticsUserId: 'angular-demo-user'
        });
      });
    } catch (error) {
      this.sendState.set({
        tone: 'error',
        title: 'Angular-native sample failed before send',
        detail: error instanceof Error ? error.message : 'Unexpected Angular-native SDK setup error.'
      });
    }
  }

  private createFaultLensService(config: FaultLensConfig): FaultLensService {
    const injector = createEnvironmentInjector([
      importProvidersFrom(FaultLensModule.forRoot(config, { debug: true }))
    ], this.environmentInjector);

    return injector.get(FaultLensService);
  }

  private async captureDeliveryResult(
    state: WritableSignal<SendState>,
    smokeId: string,
    release: string,
    triggerSend: () => void
  ): Promise<void> {
    const tenantHost = this.normalizedTenantHost();
    const originalFetch = globalThis.fetch?.bind(globalThis);
    if (!originalFetch) {
      state.set({
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
        state.set({
          tone: 'success',
          title: 'Request submitted',
          detail: `The Angular SDK issued the ingest request. Check FaultLens Events using smoke ID ${smokeId}.`
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

          state.set(response.ok ? {
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
          state.set({
            tone: 'error',
            title: 'Send failed',
            detail: error instanceof Error ? error.message : 'Unexpected Angular SDK error.'
          });
          resolve();
        }
      }
    });
  }
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
