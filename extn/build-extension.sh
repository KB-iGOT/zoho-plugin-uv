#!/bin/bash
mkdir -p dist
cp manifest.json content.js background.js popup.html popup.js dist/
echo "Extension files copied to dist/ folder"
echo "Load the dist/ folder in Chrome extensions"