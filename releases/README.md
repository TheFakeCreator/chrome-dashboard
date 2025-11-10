# Releases

This folder contains packaged releases of the Chrome Dashboard extension.

## Release Naming Convention

Releases follow this format:
```
chrome-dashboard-v{version}-{status}.zip
```

Example:
- `chrome-dashboard-v2.0.0-stable.zip`
- `chrome-dashboard-v2.1.0-beta.zip`
- `chrome-dashboard-v2.0.1-rc.zip`

## Version Tags

- **alpha**: Early development, unstable
- **beta**: Feature complete, testing phase
- **rc**: Release candidate, final testing
- **stable**: Production ready

## Creating a Release

Run the build script:
```bash
pnpm run build
```

This will create a packaged .zip file in this directory.

## Installation from Release

1. Download the desired release .zip file
2. Unzip the archive
3. Open Chrome and go to `chrome://extensions/`
4. Enable "Developer mode"
5. Click "Load unpacked"
6. Select the unzipped folder

## Changelog

See [CHANGELOG.md](../CHANGELOG.md) for details about each release.
