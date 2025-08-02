#!/bin/bash

set -e

# Restore all git changes
git restore --source=HEAD --staged --worktree -- package.json pnpm-lock.yaml

# Release packages
TAG="latest"
echo "⚡ Publishing $PKG with tag $TAG"
pnpm publish --access public --no-git-checks --tag $TAG

echo "⚡ Publishing $PKG for jsr registry"
pnpx jsr publish -c jsr.json
