#!/usr/bin/env bash
# The default image's node binary stays ahead of nvm on PATH, so this downloads
# the Node release required by www-root/package.json and links it first.
set -euo pipefail

resolve_node_version() {
  local engine="$1"
  if [[ "$engine" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
    printf '%s\n' "$engine"
    return
  fi

  local major=""
  if [[ "$engine" =~ ^([0-9]+)\.x$ || "$engine" =~ ^([0-9]+)$ ]]; then
    major="${BASH_REMATCH[1]}"
  else
    echo "www-root/package.json engines.node is '${engine}'. Use a major, a major.x range, or an exact x.y.z." >&2
    return 1
  fi

  local version
  version="$(
    curl -fsSL "https://nodejs.org/dist/latest-v${major}.x/SHASUMS256.txt" \
      | awk -v major="$major" '$2 ~ "^node-v" major "\\.[0-9]+\\.[0-9]+-linux-x64\\.tar\\.xz$" {
          sub(/^node-v/, "", $2)
          sub(/-linux-x64\.tar\.xz$/, "", $2)
          print $2
          exit
        }'
  )"
  if [[ -z "$version" ]]; then
    echo "Could not resolve a Node ${major} release." >&2
    return 1
  fi
  printf '%s\n' "$version"
}

engine="$(node -p "require('./www-root/package.json').engines.node")"
NODE_VERSION="$(resolve_node_version "$engine")"
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
echo "Using $(command -v node) $(node -v) from engines ${engine}"

# npm 11 skips dependency install scripts unless they are approved.
# esbuild, swc, and sharp need those scripts.
npm config set dangerously-allow-all-scripts true

npm install --prefix www-root
