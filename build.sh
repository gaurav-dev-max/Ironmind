#!/bin/bash
# Exit immediately if a command exits with a non-zero status
set -e

# Create dist directory for compiled deployment
mkdir -p dist

# Concatenate all modular source pieces in exact order into dist/index.html
cat src/head.html \
    src/header.html \
    src/gym.html \
    src/nutrition.html \
    src/focus.html \
    src/nav.html \
    src/modals.html \
    src/script.js > dist/index.html

echo "Compilation successful: dist/index.html generated."
