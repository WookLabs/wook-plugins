#!/usr/bin/env bash
# Auto-download and install verible-verilog-ls from GitHub releases.
# Runs as a SessionStart hook. After install, rewrites .lsp.json with
# the absolute path so Claude Code can find the binary without PATH.
set -euo pipefail

INSTALL_DIR="$HOME/.claude/tools/verible"
GITHUB_REPO="chipsalliance/verible"
API_URL="https://api.github.com/repos/${GITHUB_REPO}/releases/latest"

TMPDIR_CLEANUP=""
trap 'rm -rf "$TMPDIR_CLEANUP"' EXIT

die() { echo "ERROR: $*" >&2; exit 1; }

# --- Platform detection ---
detect_platform() {
  local os arch
  os="$(uname -s)"
  arch="$(uname -m)"

  case "$os" in
    Linux)
      BINARY_NAME="verible-verilog-ls"
      ARCHIVE_EXT="tar.gz"
      case "$arch" in
        x86_64|amd64) ASSET_SUFFIX="linux-static-x86_64" ;;
        aarch64|arm64) ASSET_SUFFIX="linux-static-arm64" ;;
        *) die "Unsupported Linux architecture: $arch" ;;
      esac
      ;;
    Darwin)
      BINARY_NAME="verible-verilog-ls"
      ASSET_SUFFIX="macOS"
      ARCHIVE_EXT="tar.gz"
      ;;
    MSYS*|MINGW*|CYGWIN*)
      BINARY_NAME="verible-verilog-ls.exe"
      ASSET_SUFFIX="win64"
      ARCHIVE_EXT="zip"
      ;;
    *)
      die "Unsupported OS: $os"
      ;;
  esac
}

# --- Find existing binary ---
# Returns 0 and sets BINARY_PATH if found, 1 otherwise.
find_binary() {
  # 1) System PATH
  if command -v verible-verilog-ls &>/dev/null; then
    BINARY_PATH="$(command -v verible-verilog-ls)"
    return 0
  fi
  # 2) INSTALL_DIR/bin/ (Linux/macOS archive layout)
  if [[ -x "$INSTALL_DIR/bin/$BINARY_NAME" ]]; then
    BINARY_PATH="$INSTALL_DIR/bin/$BINARY_NAME"
    return 0
  fi
  # 3) INSTALL_DIR/ (Windows archive layout - no bin/ subdir)
  if [[ -x "$INSTALL_DIR/$BINARY_NAME" ]]; then
    BINARY_PATH="$INSTALL_DIR/$BINARY_NAME"
    return 0
  fi
  return 1
}

# --- Download and install ---
install_verible() {
  echo "verible-verilog-ls not found. Downloading from GitHub..."

  # Fetch latest release tag
  local api_json tag_name
  api_json="$(curl -fsSL "$API_URL" 2>/dev/null)" \
    || die "Failed to fetch GitHub API (rate-limited or no network?)"

  tag_name="$(python3 -c "import json,sys; print(json.load(sys.stdin)['tag_name'])" <<< "$api_json")" \
    || die "Failed to parse release tag from GitHub API response"

  echo "Latest release: $tag_name"

  # Build asset URL
  local asset_url
  asset_url="https://github.com/${GITHUB_REPO}/releases/download/${tag_name}/verible-${tag_name}-${ASSET_SUFFIX}.${ARCHIVE_EXT}"

  # Download
  local tmpdir archive_path
  tmpdir="$(mktemp -d)"
  TMPDIR_CLEANUP="$tmpdir"
  archive_path="$tmpdir/verible.${ARCHIVE_EXT}"

  echo "Downloading: $asset_url"
  curl -fSL --progress-bar -o "$archive_path" "$asset_url" \
    || die "Download failed: $asset_url"

  # Verify file size > 1MB (detect 404 HTML or rate-limit response)
  local file_size
  file_size="$(wc -c < "$archive_path" | tr -d ' ')"
  if [[ "$file_size" -lt 1048576 ]]; then
    die "Downloaded file too small (${file_size} bytes). Possibly a 404 or rate-limit page."
  fi

  # Extract
  mkdir -p "$INSTALL_DIR"

  if [[ "$ARCHIVE_EXT" == "tar.gz" ]]; then
    tar xzf "$archive_path" --strip-components=1 -C "$INSTALL_DIR"
  elif [[ "$ARCHIVE_EXT" == "zip" ]]; then
    unzip -qo "$archive_path" -d "$tmpdir/extracted"
    # Windows zip has a top-level verible-<tag>-win64/ directory
    local inner_dir
    inner_dir="$(find "$tmpdir/extracted" -maxdepth 1 -type d -name 'verible-*' | head -1)"
    if [[ -n "$inner_dir" ]]; then
      cp -a "$inner_dir"/. "$INSTALL_DIR"/
    else
      cp -a "$tmpdir/extracted"/. "$INSTALL_DIR"/
    fi
  fi

  # Save version
  echo "$tag_name" > "$INSTALL_DIR/.version"

  echo "Installed verible $tag_name to $INSTALL_DIR"
}

# --- Resolve absolute path (MSYS → native Windows path) ---
resolve_abs_path() {
  local p="$1"
  case "$(uname -s)" in
    MSYS*|MINGW*|CYGWIN*)
      # Convert /c/Users/... → C:/Users/...
      if [[ "$p" =~ ^/([a-zA-Z])/ ]]; then
        p="${BASH_REMATCH[1]^^}:/${p:3}"
      fi
      ;;
  esac
  echo "$p"
}

# --- Write .lsp.json with absolute path ---
write_lsp_json() {
  local abs_path
  abs_path="$(resolve_abs_path "$BINARY_PATH")"

  local lsp_json="$PLUGIN_ROOT/.lsp.json"

  cat > "$lsp_json" <<ENDJSON
{
  "verilog": {
    "command": "$abs_path",
    "args": ["--rules_config_search"],
    "extensionToLanguage": {
      ".v": "verilog",
      ".vh": "verilog",
      ".sv": "systemverilog",
      ".svh": "systemverilog"
    }
  }
}
ENDJSON

  echo "Updated $lsp_json → command: $abs_path"
}

# === Main ===
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$SCRIPT_DIR/.." && pwd)}"

detect_platform

if find_binary; then
  echo "verible-verilog-ls found: $BINARY_PATH"
else
  install_verible
  # Re-check after install
  if ! find_binary; then
    die "Installation succeeded but binary not found at expected location"
  fi
  echo "verible-verilog-ls ready: $BINARY_PATH"
fi

write_lsp_json
exit 0
