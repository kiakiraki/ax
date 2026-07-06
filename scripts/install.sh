#!/bin/sh
# ax installer — usage: curl -fsSL https://ax.yusuke.run/install | sh
set -eu

REPO="yusukebe/ax"
INSTALL_DIR="${AX_INSTALL_DIR:-$HOME/.local/bin}"

# Detect platform
case "$(uname -s)" in
  Darwin) os="darwin" ;;
  Linux) os="linux" ;;
  *) echo "ax: unsupported OS: $(uname -s) (use Windows via the .exe release asset)" >&2; exit 1 ;;
esac

case "$(uname -m)" in
  arm64 | aarch64) arch="arm64" ;;
  x86_64 | amd64) arch="x64" ;;
  *) echo "ax: unsupported architecture: $(uname -m)" >&2; exit 1 ;;
esac

asset="ax-$os-$arch"
url="https://github.com/$REPO/releases/latest/download/$asset"

echo "Downloading $asset ..."
mkdir -p "$INSTALL_DIR"
curl -fsSL "$url" -o "$INSTALL_DIR/ax"
chmod +x "$INSTALL_DIR/ax"

echo "Installed ax to $INSTALL_DIR/ax"

case ":$PATH:" in
  *":$INSTALL_DIR:"*) ;;
  *)
    echo ""
    echo "NOTE: $INSTALL_DIR is not in your PATH. Add this to your shell profile:"
    echo "  export PATH=\"$INSTALL_DIR:\$PATH\""
    ;;
esac

echo ""
"$INSTALL_DIR/ax" --version
echo "Run 'ax --help' to get started."
