# Chrome Dashboard - Project Structure

## 📁 Directory Structure

```
chrome-dashboard/
│
├── 📂 .github/                     # GitHub specific files
│   └── COPILOT_INSTRUCTIONS.md    # Development guidelines for GitHub Copilot
│
├── 📂 .husky/                      # Git hooks (via Husky)
│   └── pre-commit                  # Run linting before commits
│
├── 📂 src/                         # Source code (development)
│   ├── 📂 core/                    # Core application files
│   │   ├── main.js                 # Application entry point
│   │   ├── config.js               # Configuration management
│   │   └── storage.js              # Storage utilities
│   │
│   ├── 📂 features/                # Feature modules
│   │   ├── 📂 focus/               # Focus mode & Pomodoro
│   │   ├── 📂 tasks/               # Task management
│   │   ├── 📂 notes/               # Quick notes & clipboard
│   │   ├── 📂 widgets/             # Widget system
│   │   ├── 📂 search/              # Search & command palette
│   │   ├── 📂 automation/          # Workflow automation
│   │   └── 📂 analytics/           # Productivity analytics
│   │
│   ├── 📂 utils/                   # Utility functions
│   │   ├── dom.js                  # DOM manipulation helpers
│   │   ├── validators.js           # Input validation
│   │   ├── formatters.js           # Data formatting
│   │   └── helpers.js              # General helpers
│   │
│   ├── 📂 styles/                  # CSS files
│   │   ├── base.css                # Base styles & variables
│   │   ├── components/             # Component styles
│   │   ├── features/               # Feature-specific styles
│   │   └── themes/                 # Theme files
│   │
│   └── 📂 assets/                  # Static assets
│       ├── icons/                  # Icon files
│       ├── images/                 # Image files
│       └── fonts/                  # Custom fonts
│
├── 📂 stylesheets/                 # Legacy CSS (to be migrated)
│   ├── base.css
│   ├── header.css
│   ├── sections.css
│   └── ...
│
├── 📂 tests/                       # Test files
│   ├── unit/                       # Unit tests
│   ├── integration/                # Integration tests
│   └── e2e/                        # End-to-end tests
│
├── 📂 docs/                        # Documentation
│   ├── API.md                      # API documentation
│   ├── ARCHITECTURE.md             # Architecture overview
│   ├── USER_GUIDE.md               # User guide
│   └── CONTRIBUTING.md             # Contribution guidelines
│
├── 📂 scripts/                     # Build and utility scripts
│   ├── build.js                    # Production build script
│   └── dev.js                      # Development utilities
│
├── 📂 releases/                    # Release packages
│   └── README.md                   # Release documentation
│
├── 📂 dist/                        # Built files (gitignored)
│
├── 📄 manifest.json                # Chrome extension manifest
├── 📄 newtab.html                  # Main dashboard HTML
├── 📄 popup.html                   # Extension popup HTML
├── 📄 background.js                # Service worker (to be moved)
│
├── 📄 package.json                 # npm/pnpm dependencies
├── 📄 pnpm-lock.yaml               # pnpm lock file
│
├── 📄 .eslintrc.js                 # ESLint configuration
├── 📄 .prettierrc.json             # Prettier configuration
├── 📄 .editorconfig                # Editor configuration
├── 📄 .gitignore                   # Git ignore rules
│
├── 📄 ROADMAP.md                   # Development roadmap
├── 📄 CHANGELOG.md                 # Version history
├── 📄 README.md                    # Project overview
├── 📄 CONTRIBUTING.md              # Contribution guidelines
├── 📄 LICENSE                      # MIT License
└── 📄 COPILOT.md                   # Copilot specific docs
```

## 📦 Migration Plan

### Phase 1: File Organization
Current root-level files will be migrated to appropriate locations:

**JavaScript Files** → `src/core/` or `src/features/`
- `main.js` → `src/core/main.js`
- `sections.js` → `src/features/sections/`
- `search.js` → `src/features/search/`
- `weather.js` → `src/features/widgets/weather/`
- `clock.js` → `src/features/widgets/clock/`
- `tracking.js` → `src/features/analytics/`
- `settings.js` → `src/core/settings.js`
- `modal.js` → `src/utils/modal.js`
- `customDropdown.js` → `src/utils/dropdown.js`
- `ai.js` → `src/features/search/ai.js`
- `tabGroups.js` → `src/features/tabs/`
- `popup.js` → `src/core/popup.js`
- `background.js` → `src/core/background.js`
- `dev-tools.js` → `scripts/dev-tools.js`

**CSS Files** → `src/styles/`
- `stylesheets/` → `src/styles/legacy/` (temporary)
- New modular structure in `src/styles/`

**HTML Files** → Root (no change for now)
- `newtab.html`
- `popup.html`

## 🔧 Build Process

### Development
```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm run dev
# Then load unpacked extension in Chrome

# Lint code
pnpm run lint

# Format code
pnpm run format
```

### Production
```bash
# Build production package
pnpm run build
# Creates: releases/chrome-dashboard-v{version}.zip
```

## 📝 File Naming Conventions

### JavaScript
- **Classes**: PascalCase (e.g., `TaskManager.js`)
- **Utilities**: camelCase (e.g., `formatDate.js`)
- **Features**: kebab-case folder, PascalCase file (e.g., `focus-mode/FocusMode.js`)

### CSS
- **Files**: kebab-case (e.g., `focus-mode.css`)
- **Classes**: BEM notation (e.g., `focus-mode__timer--active`)

### Tests
- **Pattern**: `{filename}.test.js` (e.g., `TaskManager.test.js`)

## 🎯 Module System

The project uses ES6 modules:

```javascript
// ✅ Good
import { TaskManager } from './features/tasks/TaskManager.js';
export class FocusMode { ... }
export default config;

// ❌ Avoid
const TaskManager = require('./tasks');
module.exports = { ... };
```

## 🔐 Configuration

Configuration is managed through:
- `src/core/config.js` - Application config
- `manifest.json` - Extension config
- `.env` files - Environment variables (local only)

## 📊 Data Flow

```
User Interaction
    ↓
UI Components (src/features/)
    ↓
Core Logic (src/core/)
    ↓
Storage Layer (chrome.storage API)
    ↓
Background Service Worker
```

## 🧪 Testing Strategy

- **Unit Tests**: Individual functions and classes
- **Integration Tests**: Feature modules working together
- **E2E Tests**: Complete user workflows

## 📚 Documentation Standards

Each feature should have:
1. **README.md** in feature folder
2. **JSDoc comments** in code
3. **API documentation** in `docs/`
4. **User guide** section

## 🚀 Deployment

1. Version bump in `manifest.json` and `package.json`
2. Update `CHANGELOG.md`
3. Run `pnpm run build`
4. Test the built package
5. Create GitHub release
6. Submit to Chrome Web Store

---

*Last Updated: November 10, 2025*
