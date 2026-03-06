#!/usr/bin/env bash
# Check if verible-verilog-ls is available in PATH

if command -v verible-verilog-ls &>/dev/null; then
  VERSION=$(verible-verilog-ls --version 2>&1 | head -1)
  echo "verible-verilog-ls found: $VERSION"
  exit 0
fi

echo "WARNING: verible-verilog-ls not found in PATH."
echo ""
echo "Install from GitHub releases:"
echo "  https://github.com/chipsalliance/verible/releases"
echo ""
echo "Installation:"
echo "  Windows: Download verible-<version>-win64.zip, extract, add bin/ to PATH"
echo "  Linux:   Download verible-<version>-linux-static-x86_64.tar.gz, extract, add bin/ to PATH"
echo "  macOS:   brew install verible"
echo ""
echo "After installation, restart Claude Code to activate the LSP plugin."
exit 0
