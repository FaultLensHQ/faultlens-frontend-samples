export type SampleFormState = {
  tenantHost: string;
  projectApiKey: string;
  environment: FaultLensEnvironment;
  releasePrefix: string;
};

export type FaultLensEnvironment = 'staging' | 'production' | 'development';

declare global {
  interface Window {
    __FAULTLENS_SAMPLE_CONFIG__?: Partial<SampleFormState>;
  }
}

export function readRuntimeConfig(): SampleFormState {
  const runtime = window.__FAULTLENS_SAMPLE_CONFIG__ ?? {};

  return {
    tenantHost: runtime.tenantHost?.trim() ?? '',
    projectApiKey: runtime.projectApiKey?.trim() ?? '',
    environment: normalizeEnvironment(runtime.environment),
    releasePrefix: runtime.releasePrefix?.trim() ?? 'frontend-sample'
  };
}

export function normalizeEnvironment(value: string | undefined): FaultLensEnvironment {
  const normalized = value?.trim().toLowerCase();

  if (normalized === 'production' || normalized === 'development') {
    return normalized;
  }

  return 'staging';
}
