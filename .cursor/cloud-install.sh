#!/usr/bin/env bash
# Installs the Node release named by NODE_VERSION (set in .cursor/environment.json)
# onto ~/.local/bin, which login shells and ~/.bashrc both put ahead of /exec-daemon/node.
set -euo pipefail

NODE_VERSION="${NODE_VERSION:?Set NODE_VERSION in .cursor/environment.json, for example 24.22.2}"
NODE_ROOT="${HOME}/.local/node"
PATH_LINE='export PATH="$HOME/.local/bin:$PATH"'

if ! "${NODE_ROOT}/bin/node" -v 2>/dev/null | grep -qx "v${NODE_VERSION}"; then
  tmp="$(mktemp -d)"
  curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz" \
    | tar -xJ -C "${tmp}" --strip-components=1
  rm -rf "${NODE_ROOT}"
  mkdir -p "${HOME}/.local"
  mv "${tmp}" "${NODE_ROOT}"
fi

mkdir -p "${HOME}/.local/bin"
for cmd in node npm npx corepack; do
  if [ -e "${NODE_ROOT}/bin/${cmd}" ]; then
    ln -sfn "${NODE_ROOT}/bin/${cmd}" "${HOME}/.local/bin/${cmd}"
  fi
done

if ! grep -Fq "${PATH_LINE}" "${HOME}/.bashrc"; then
  printf '\n%s\n' "${PATH_LINE}" >> "${HOME}/.bashrc"
fi

export PATH="${HOME}/.local/bin:${PATH}"
hash -r
echo "Using $(command -v node) $(node -v)"

# npm 11 skips dependency install scripts unless they are approved.
# esbuild, swc, and sharp need those scripts.
npm config set dangerously-allow-all-scripts true

npm install --prefix legacy-2014
npm install --prefix www-root
