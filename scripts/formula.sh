#!/bin/sh
# Generate Formula/ax.rb for the Homebrew tap.
# usage: scripts/formula.sh <version> <checksums.txt path>
set -eu

VERSION="$1"
CHECKSUMS="$2"

sha() {
  grep "$1\$" "$CHECKSUMS" | cut -d' ' -f1
}

cat << EOF
class Ax < Formula
  desc "The AI-era curl: fetch, discover, extract. One command."
  homepage "https://ax.yusuke.run"
  version "$VERSION"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/yusukebe/ax/releases/download/v$VERSION/ax-darwin-arm64"
      sha256 "$(sha ax-darwin-arm64)"
    else
      url "https://github.com/yusukebe/ax/releases/download/v$VERSION/ax-darwin-x64"
      sha256 "$(sha ax-darwin-x64)"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/yusukebe/ax/releases/download/v$VERSION/ax-linux-arm64"
      sha256 "$(sha ax-linux-arm64)"
    else
      url "https://github.com/yusukebe/ax/releases/download/v$VERSION/ax-linux-x64"
      sha256 "$(sha ax-linux-x64)"
    end
  end

  def install
    bin.install Dir["ax-*"].first => "ax"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/ax --version")
  end
end
EOF
