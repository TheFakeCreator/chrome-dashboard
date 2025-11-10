# 🚀 Chrome Dashboard v2.0

> A modern, productivity-focused Chrome extension that transforms your new tab into a powerful, customizable dashboard.

![Chrome Dashboard](https://img.shields.io/badge/version-2.0.0--alpha-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Chrome](https://img.shields.io/badge/chrome-v120+-brightgreen.svg)

---

## ✨ Features

### � **Focus Mode & Pomodoro Timer**
- **Circular Progress Timer**: Beautiful SVG-based timer with real-time progress visualization
- **Pomodoro Technique**: 25/5/15 minute intervals (fully customizable)
- **Session Tracking**: Automatic logging of completed focus sessions
- **Statistics Dashboard**: View daily, weekly, and monthly productivity metrics
- **Streak Tracking**: Monitor your consistency with daily streaks
- **Smart Notifications**: Browser notifications when sessions complete
- **Configurable Settings**: Customize all timer durations and behaviors
  - Work duration (1-90 minutes)
  - Short break (1-30 minutes)
  - Long break (5-60 minutes)
  - Long break interval (after N sessions)
  - Auto-start options
  - Sound & notification preferences

### 🔍 **Intelligent Multi-Engine Search**
- **10+ Search Engines**: Google, Bing, DuckDuckGo, YouTube, GitHub, Wikipedia, and more
- **AI-Powered Search**: Direct access to ChatGPT, Google Gemini, Claude, Perplexity
- **Custom Engine Dropdown**: Quick access to all search providers with icons
- **Keyboard Navigation**: Instant focus with `/` key, submit with Enter
- **Responsive Design**: Full-width search bar with elegant UI

### 🌤️ **Weather Widget**
- **Real-time Weather**: Current conditions with location detection
- **Detailed Information**: Temperature, humidity, wind speed, feels-like
- **Beautiful Icons**: Weather condition visualization
- **Auto-refresh**: Keeps data up-to-date automatically

### 🕐 **Digital Clock Widget**
- **Real-time Display**: Hours, minutes, seconds with smooth animations
- **Clean Design**: Minimalist interface with gradient styling
- **Always Visible**: Stays in view in the center panel

### 🔗 **Quick Links**
- **Customizable Bookmarks**: Add your favorite sites with custom names and icons
- **Fast Access**: One-click navigation to frequently visited pages
- **Icon Support**: Automatic favicon fetching or custom icons

### 🧩 **Extension Control Widget**
- **Extension Management**: View all installed Chrome extensions
- **Quick Toggle**: Enable/disable extensions with one click
- **Search & Filter**: Find extensions instantly
- **Status Indicators**: Visual feedback for enabled/disabled state
- **Grouped Display**: Enabled extensions shown first

### 🎨 **Modern UI/UX**
- **Panel System**: Multi-panel layout with swipe gestures
  - Center Panel: Main content (clock, weather, search)
  - Left Panel: Focus mode widget (swipe left or Alt+Left)
  - Top Panel: Extension control (swipe up or Alt+Up)
  - Bottom Panel: Quick links (swipe down or Alt+Down)
- **Glass Morphism**: Beautiful glassmorphic design with backdrop blur
- **Dark Theme**: Eye-friendly dark mode optimized for productivity
- **Lucide Icons**: Professional, consistent iconography throughout
- **Tailwind CSS**: Modern utility-first styling
- **Smooth Animations**: Polished transitions and interactions
- **Responsive Layout**: Works beautifully on all screen sizes

## 🚀 Quick Start

### Prerequisites
- Chrome browser v120 or higher
- Node.js 18+ and pnpm (for development)

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/TheFakeCreator/chrome-dashboard.git
   cd chrome-dashboard
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Build the Extension**
   ```bash
   pnpm build
   ```

4. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the `dist` folder
   - The extension will automatically replace your new tab page

5. **Start Using**
   - Open a new tab to see your dashboard
   - Swipe or use keyboard shortcuts to access different panels
   - Click settings icons to customize widgets

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` | Focus search bar |
| `Enter` | Search / Submit |
| `Alt + Left` | Open left panel (Focus Mode) |
| `Alt + Up` | Open top panel (Extensions) |
| `Alt + Down` | Open bottom panel (Quick Links) |
| `Esc` | Close open panels |

## 🎯 Usage Guide

### Using Focus Mode
1. **Access:** Swipe left or press `Alt + Left`
2. **Start Session:** Click "Start" to begin a 25-minute focus session
3. **Manage Timer:** Use Pause, Stop, or Skip buttons as needed
4. **View Stats:** Toggle to "Stats" view to see your productivity metrics
5. **Customize:** Click settings icon to adjust durations and preferences

### Managing Extensions
1. **Access:** Swipe up or press `Alt + Up`
2. **Toggle:** Click the switch to enable/disable any extension
3. **Search:** Use the search bar to find specific extensions
4. **Quick View:** See all enabled extensions at the top

### Quick Search
1. **Focus:** Press `/` or click the search bar
2. **Type:** Enter your search query
3. **Select Engine:** Use dropdown to choose search provider
4. **Search:** Press Enter or click the search button
5. **AI Chat:** Select ChatGPT, Gemini, or Claude for AI-powered assistance

### Weather Widget
- Weather updates automatically based on your location
- Hover for detailed information (humidity, wind, feels-like)
- Click refresh icon to manually update

### Quick Links
1. **Access:** Swipe down or press `Alt + Down`
2. **Add Link:** Click "+" button to add new bookmark
3. **Edit:** Click edit icon on any link card
4. **Remove:** Click delete icon to remove links

## 🏗️ Architecture

Chrome Dashboard v2.0 follows industry-standard best practices with a modular, scalable architecture:

```
chrome-dashboard/
├── 📁 src/                      # Source code
│   ├── 📁 components/           # Reusable UI components
│   │   ├── BaseComponent.js     # Base class for all components
│   │   ├── Modal.js             # Modal dialog system
│   │   ├── PanelManager.js      # Multi-panel layout manager
│   │   └── SettingsModal.js     # Settings management UI
│   ├── 📁 widgets/              # Dashboard widgets
│   │   ├── BaseWidget.js        # Base widget class
│   │   ├── ClockWidget.js       # Digital clock
│   │   ├── WeatherWidget.js     # Weather display
│   │   ├── SearchWidget.js      # Multi-engine search
│   │   ├── FocusWidget.js       # Pomodoro timer
│   │   ├── QuickLinksWidget.js  # Bookmark management
│   │   └── ExtensionControlWidget.js  # Extension manager
│   ├── � services/             # Business logic & state
│   │   ├── PomodoroTimer.js     # Timer logic
│   │   ├── FocusStats.js        # Statistics tracking
│   │   └── ExtensionManager.js  # Chrome extension API
│   ├── 📁 core/                 # Core systems
│   │   ├── App.js               # Application orchestrator
│   │   ├── EventBus.js          # Global event system
│   │   ├── StateManager.js      # Reactive state management
│   │   └── StorageManager.js    # Chrome storage wrapper
│   ├── � utils/                # Helper utilities
│   │   ├── icons.js             # Lucide icon initialization
│   │   ├── dom.js               # DOM manipulation helpers
│   │   └── time.js              # Time formatting utilities
│   ├── � styles/               # Styling
│   │   ├── globals.css          # Global styles & variables
│   │   ├── widgets.css          # Widget-specific styles
│   │   ├── panels.css           # Panel system styles
│   │   └── responsive.css       # Responsive design
│   ├── � assets/               # Static assets
│   │   └── icon128.png          # Extension icon
│   └── main.js                  # Application entry point
├── 📁 dist/                     # Production build (generated)
├── 📄 newtab.html               # Main HTML template
├── � background.js             # Service worker
├── 📄 popup.html                # Extension popup
├── 📄 manifest.json             # Extension manifest (v3)
├── 📄 vite.config.js            # Build configuration
├── 📄 tailwind.config.js        # Tailwind CSS config
├── � package.json              # Dependencies
└── 📄 pnpm-lock.yaml            # Dependency lock file
```

### Design Patterns

- **Component-Based Architecture**: Modular, reusable components with clear responsibilities
- **Event-Driven Communication**: EventBus for decoupled component interaction
- **State Management**: Centralized state with reactive updates
- **Service Layer**: Business logic separated from UI components
- **Widget System**: Extensible widget framework with BaseWidget class
- **Panel Management**: Multi-panel layout with gesture support

## �️ Development

### Setup Development Environment

```bash
# Clone repository
git clone https://github.com/TheFakeCreator/chrome-dashboard.git
cd chrome-dashboard

# Install dependencies (use pnpm for faster, more efficient package management)
pnpm install

# Start development build with watch mode
pnpm dev

# Build for production
pnpm build

# Run linter
pnpm lint

# Format code
pnpm format
```

### Development Workflow

1. **Make Changes**: Edit files in `src/` directory
2. **Auto-Build**: Changes automatically rebuild in dev mode
3. **Reload Extension**: Click reload in `chrome://extensions/`
4. **Test**: Open new tab to see changes
5. **Debug**: Use Chrome DevTools (F12)

### Creating a New Widget

```javascript
// src/widgets/MyWidget.js
import { BaseWidget } from './BaseWidget.js';

export class MyWidget extends BaseWidget {
  constructor(app, options = {}) {
    super(app, {
      widgetId: 'my-widget',
      title: 'My Widget',
      icon: '<i data-lucide="star" class="w-5 h-5"></i>',
      description: 'My custom widget',
      ...options
    });
  }

  getDefaultSettings() {
    return {
      option1: true,
      option2: 'value'
    };
  }

  async loadData() {
    // Fetch data here
  }

  renderContent() {
    return `
      <div class="p-4">
        <h3>My Widget Content</h3>
      </div>
    `;
  }

  setupEventListeners() {
    super.setupEventListeners();
    // Add custom event listeners
  }
}
```

### Adding a New Service

```javascript
// src/services/MyService.js
import { EventEmitter } from '../utils/EventEmitter.js';

export class MyService extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = options;
  }

  async initialize() {
    // Initialize service
  }

  // Service methods...
}
```

### Extending Search Engines

```javascript
// In src/widgets/SearchWidget.js
const searchEngines = {
  myEngine: {
    name: 'My Engine',
    icon: '🔍',
    url: 'https://myengine.com/search?q={query}',
    placeholder: 'Search My Engine...'
  }
};
```

## 🎨 Customization

### Theming
- Edit CSS variables in `src/styles/globals.css`
- Modify Tailwind config in `tailwind.config.js`
- Create custom widget styles in `src/styles/widgets.css`

### Widget Configuration
- Each widget has configurable settings accessible via settings icon
- Settings are persisted in Chrome storage
- Default settings defined in `getDefaultSettings()` method

### Panel Layout
- Modify panel positions in `src/main.js`
- Customize panel styles in `src/styles/panels.css`
- Add gesture support in `PanelManager.js`

## 🔒 Privacy & Security

- **100% Local**: All data stored in Chrome's local storage - nothing sent to external servers
- **No Analytics**: No tracking, no telemetry, no data collection
- **Manifest V3**: Uses latest Chrome extension security standards
- **Permissions**: Only requests necessary permissions:
  - `storage`: Save settings and widget data
  - `tabs`: Manage browser tabs (extension control widget)
  - `notifications`: Show session completion alerts
  - `management`: View and control extensions
- **Open Source**: Full transparency - review the code yourself

## 🐛 Troubleshooting

### Extension Not Loading
**Problem:** Extension doesn't appear after installation

**Solutions:**
- Ensure Developer mode is enabled in `chrome://extensions/`
- Verify you're loading the `dist` folder (not the root)
- Check console for build errors
- Try running `pnpm build` again

### Icons Not Showing
**Problem:** Lucide icons don't render

**Solutions:**
- Reload the extension in `chrome://extensions/`
- Clear browser cache (`Ctrl+Shift+Delete`)
- Check if `lucide` is loaded in DevTools console
- Verify internet connection for CDN access

### Weather Not Displaying
**Problem:** Weather widget shows loading or error

**Solutions:**
- Allow location access when prompted
- Check browser location permissions
- Verify internet connection
- Try manual refresh using widget's refresh button

### Focus Timer Not Starting
**Problem:** Start button doesn't respond

**Solutions:**
- Check browser console for errors
- Reload the extension
- Verify storage permissions are granted
- Try resetting widget settings

### Panels Not Opening
**Problem:** Swipe gestures or keyboard shortcuts don't work

**Solutions:**
- Click anywhere on the page first to focus
- Try keyboard shortcuts (`Alt + Arrow keys`)
- Check if gestures are enabled in browser
- Reload the page

### Build Errors
**Problem:** `pnpm build` fails

**Solutions:**
```bash
# Clear node modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Clear build cache
rm -rf dist

# Rebuild
pnpm build
```

## 📊 Tech Stack

- **Build Tool**: Vite 7.x (lightning-fast builds)
- **Package Manager**: pnpm (efficient, fast)
- **Styling**: Tailwind CSS + Custom CSS
- **Icons**: Lucide Icons
- **JavaScript**: ES6+ Modules (no framework dependencies)
- **Storage**: Chrome Storage API
- **Architecture**: Component-based, event-driven

## 🗺️ Roadmap

### ✅ Completed (v2.0-alpha)
- [x] Modern component-based architecture
- [x] Focus Mode with Pomodoro Timer
- [x] Statistics tracking and visualization
- [x] Extension control widget
- [x] Multi-panel layout system
- [x] Weather widget with real-time data
- [x] Multi-engine search with AI integration
- [x] Quick links bookmark system
- [x] Configurable widget settings
- [x] Lucide icon integration
- [x] Tailwind CSS styling

### 🚧 In Progress (v2.1)
- [ ] Tab groups management
- [ ] AI chat integration (sidebar)
- [ ] Custom themes and color schemes
- [ ] Widget drag-and-drop positioning
- [ ] Export/import settings
- [ ] Cloud sync (optional)

### 📋 Planned (v3.0)
- [ ] Calendar widget
- [ ] Notes/Todo widget
- [ ] RSS feed reader
- [ ] GitHub activity widget
- [ ] Spotify now playing
- [ ] Custom widget marketplace
- [ ] Multiple dashboard profiles

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

### Development Philosophy
- Follow industry-grade best practices
- Write clean, documented, maintainable code
- Complete one feature at a time, thoroughly
- Test extensively before submitting
- Follow existing code style and patterns

### How to Contribute

1. **Fork & Clone**
   ```bash
   git clone https://github.com/YourUsername/chrome-dashboard.git
   cd chrome-dashboard
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make Changes**
   - Follow the coding standards in `.github/.copilot-instructions.md`
   - Write clear commit messages using conventional commits
   - Test your changes thoroughly

4. **Commit Changes**
   ```bash
   git commit -m 'feat: add amazing feature'
   ```

5. **Push & Create PR**
   ```bash
   git push origin feature/amazing-feature
   ```
   - Open a Pull Request with detailed description
   - Reference any related issues
   - Wait for code review

### Commit Message Convention
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Test additions or changes
- `chore:` Build process or tooling changes

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License - Free to use, modify, and distribute
```

## 🙏 Acknowledgments

- **Icons**: [Lucide Icons](https://lucide.dev/) - Beautiful, consistent icon library
- **CSS Framework**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- **Build Tool**: [Vite](https://vitejs.dev/) - Next generation frontend tooling
- **Weather Data**: [Open-Meteo](https://open-meteo.com/) - Free weather API
- **Inspiration**: Modern productivity tools and dashboard design principles

## 📞 Support & Community

- **Issues**: [GitHub Issues](https://github.com/TheFakeCreator/chrome-dashboard/issues) - Report bugs or request features
- **Discussions**: [GitHub Discussions](https://github.com/TheFakeCreator/chrome-dashboard/discussions) - Ask questions, share ideas
- **Pull Requests**: Contributions are always welcome!

## 🌟 Show Your Support

If you find this project useful, please consider:
- ⭐ **Starring** the repository
- 🐛 **Reporting** bugs or issues you encounter
- 💡 **Suggesting** new features or improvements
- 🔧 **Contributing** code or documentation
- 📢 **Sharing** with others who might benefit

---

<div align="center">

**Made with ❤️ for productivity enthusiasts**

[Report Bug](https://github.com/TheFakeCreator/chrome-dashboard/issues) • [Request Feature](https://github.com/TheFakeCreator/chrome-dashboard/issues) • [View Roadmap](https://github.com/TheFakeCreator/chrome-dashboard/projects)

</div>
