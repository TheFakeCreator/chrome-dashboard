# Changelog

All notable changes to the Chrome Dashboard project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### 🏗️ Infrastructure
- Migrated to productivity-update-v2 branch
- Restructured project with src/, dist/, releases/, tests/, docs/, scripts/ folders
- Added comprehensive Copilot instructions for development standards
- Created detailed roadmap for v2.0 development
- Setup for pnpm package manager

### 📚 Documentation
- Added COPILOT_INSTRUCTIONS.md with development guidelines
- Created comprehensive ROADMAP.md for v2.0 features
- Initialized CHANGELOG.md

## [0.1.0] - 2025-11-10

### ✨ Features
- Customizable dashboard sections and cards
- Multi-engine search bar (Google, Bing, DuckDuckGo, YouTube, GitHub)
- AI search integration (ChatGPT, Gemini, Claude)
- Weather widget with location detection
- World clock with multiple timezones
- Tab groups management
- Usage tracking and analytics
- Bookmark management via popup extension
- Custom backgrounds
- Settings panel with various customization options
- Responsive design for all screen sizes

### 🎨 UI/UX
- Modern gradient search bar
- Modular CSS architecture
- Light and dark mode support
- Drag-and-drop card organization
- Modal dialogs for user interactions
- Custom dropdown components

### 🔧 Technical
- Chrome Manifest V3 compliance
- Local storage for data persistence
- Chrome extension popup interface
- Background service worker
- Modular JavaScript architecture

### 📝 Documentation
- Comprehensive README.md
- Contributing guidelines
- MIT License
- Basic project structure documentation

---

## Version History

### Version Naming Convention
- **Major (X.0.0)**: Breaking changes, major feature releases
- **Minor (0.X.0)**: New features, backward compatible
- **Patch (0.0.X)**: Bug fixes, minor improvements

### Release Tags
- `alpha`: Early testing phase, unstable
- `beta`: Feature complete, testing in progress
- `rc`: Release candidate, final testing
- `stable`: Production ready

---

[Unreleased]: https://github.com/TheFakeCreator/chrome-dashboard/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/TheFakeCreator/chrome-dashboard/releases/tag/v0.1.0
