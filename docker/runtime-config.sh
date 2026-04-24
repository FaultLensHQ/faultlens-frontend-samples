#!/bin/sh
set -eu

cat <<EOF >/usr/share/nginx/html/browser-sample-config.js
window.__FAULTLENS_SAMPLE_CONFIG__ = {
  tenantHost: '${FAULTLENS_TENANT_HOST:-}',
  projectApiKey: '${FAULTLENS_PROJECT_API_KEY:-}',
  environment: '${FAULTLENS_ENVIRONMENT:-staging}',
  releasePrefix: '${FAULTLENS_RELEASE_PREFIX:-frontend-sample}'
};
EOF
