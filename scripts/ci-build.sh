#!/bin/bash
# scripts/ci-build.sh
# Robust build script for CI environments

# 1. Enable Strict Mode
# -e: Exit immediately if a command exits with a non-zero status
# -u: Treat unset variables as an error
# -o pipefail: Use the exit status of the last command in the pipeline that failed
set -euo pipefail

# 2. Define Logging Functions
log_info() { echo -e "\033[36m[INFO]\033[0m $1"; }
log_success() { echo -e "\033[32m[SUCCESS]\033[0m $1"; }
log_error() { echo -e "\033[31m[ERROR]\033[0m $1" >&2; }

# 3. Error Trap
handle_error() {
  log_error "Build failed on line $1"
  exit 1
}
trap 'handle_error $LINENO' ERR

# 4. Environment Validation
log_info "Validating environment..."
if [ -z "${NODE_ENV:-}" ]; then
  log_info "NODE_ENV not set, defaulting to 'production'"
  export NODE_ENV=production
fi

# Print node version for debugging context
log_info "Node version: $(node --version)"
log_info "NPM version: $(npm --version)"

# 5. Clean Install (CI)
log_info "Installing dependencies..."
# npm ci --legacy-peer-deps (Recommended for strict CI, using install for dev speed)
npm install --legacy-peer-deps

# 6. Linting
log_info "Running lint check..."
npm run lint

# 7. Environment Variables Check (using our existing script)
log_info "Validating application configuration..."
npm run validate-env

# 8. Build
log_info "Starting build..."
npm run build

# 9. Verification
if [ -d ".next" ]; then
  log_success "Build completed successfully!"
else
  log_error ".next directory not found after build!"
  exit 1
fi
