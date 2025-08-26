# Chrome Dashboard

A modern, customizable new tab dashboard for Chrome that replaces your default new tab page with a feature-rich, personalized experience.

![Chrome Dashboard Preview](icon128.png)

## ✨ Features

### 🎨 **Customizable Interface**
- **Modular Sections**: Create custom sections for apps, websites, bookmarks, and frequently visited sites
- **Smart Card Management**: Add, edit, delete, and organize cards with drag-and-drop functionality
- **Responsive Design**: Optimized for all screen sizes from mobile to desktop
- **Custom Backgrounds**: Set personalized background images
- **Theme Options**: Light and dark mode support

### 🔍 **Intelligent Search**
- **Multi-Engine Search**: Google, Bing, DuckDuckGo, YouTube, and GitHub integration
- **AI-Powered Search**: Direct access to ChatGPT, Google Gemini, and Claude AI
- **Smart Suggestions**: Search history and frequently visited sites suggestions
- **Instant Results**: Fast, responsive search with gradient animations

### 📊 **Usage Analytics**
- **Visit Tracking**: Monitor frequently visited websites
- **Search Analytics**: Track search patterns and preferences
- **Privacy-First**: All data stored locally in your browser
- **Statistics Dashboard**: View your browsing habits and trends

### 🌤️ **Live Information Widgets**
- **Weather Integration**: Current weather conditions with location detection
- **World Clock**: Multiple timezone support with customizable locations
- **Date & Time**: Beautiful, always-visible time display
- **Daily Quotes**: Inspirational quotes to start your day

### 🔗 **Smart Bookmarking**
- **One-Click Bookmarking**: Save current page with popup extension
- **Automatic Categorization**: Smart sorting into relevant sections
- **Favicon Intelligence**: High-quality icon detection and fallbacks
- **Bookmark Management**: Full CRUD operations for all saved items

### ⚙️ **Advanced Settings**
- **Compact Mode**: Minimize header for more content space
- **Toggle Components**: Show/hide weather, time, search, quotes
- **Privacy Controls**: Enable/disable tracking and analytics
- **Export/Import**: Backup and restore your dashboard configuration

## 🚀 Installation

### Method 1: Chrome Extension (Recommended)

1. **Download the Extension**
   ```bash
   git clone https://github.com/TheFakeCreator/chrome-dashboard.git
   cd chrome-dashboard
   ```

2. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked extension"
   - Select the `chrome-dashboard` folder
   - The extension will automatically replace your new tab page

3. **Start Customizing**
   - Open a new tab to see your dashboard
   - Click the settings gear icon to customize
   - Add your favorite websites and apps

### Method 2: Local HTML File

1. **Clone and Open**
   ```bash
   git clone https://github.com/TheFakeCreator/chrome-dashboard.git
   ```

2. **Open in Browser**
   - Navigate to the project folder
   - Open `newtab.html` in Chrome
   - Bookmark the page for easy access

## 🎯 Quick Start Guide

### Adding Your First Section
1. Click the "+" button to create a new section
2. Name your section (e.g., "Work Tools", "Entertainment")
3. Add cards by clicking the "+" button within the section
4. Enter website URL, name, and icon (optional)

### Setting Up Weather
1. Click the settings gear icon
2. Allow location access when prompted
3. Weather will automatically display based on your location
4. Customize weather units and display options in settings

### Configuring Search Engines
1. Open settings panel
2. Navigate to "Search" section
3. Set your default search engine
4. Enable/disable AI search options
5. Customize search suggestions behavior

## 🏗️ Architecture

The dashboard follows a modular architecture for maintainability and extensibility:

```
chrome-dashboard/
├── 📁 stylesheets/          # Modular CSS architecture
│   ├── base.css             # Core styling and variables
│   ├── header.css           # Top navigation bar
│   ├── sections.css         # Card grid and sections
│   ├── modal.css            # Popup dialogs
│   ├── responsive.css       # Mobile responsiveness
│   └── ...
├── 📄 newtab.html          # Main dashboard page
├── 📄 popup.html           # Extension popup interface
├── 📄 manifest.json        # Chrome extension configuration
├── 🔧 main.js              # Application entry point
├── 🔧 sections.js          # Section and card management
├── 🔧 search.js            # Search functionality
├── 🔧 weather.js           # Weather widget
├── 🔧 tracking.js          # Analytics and usage tracking
├── 🔧 settings.js          # Configuration management
├── 🔧 background.js        # Extension background script
└── 📦 package.json         # Node.js dependencies (for dev server)
```

## 🔧 Development

### Prerequisites
- Node.js 16+ (for development server)
- Chrome browser
- Basic knowledge of HTML/CSS/JavaScript

### Local Development
```bash
# Clone the repository
git clone https://github.com/TheFakeCreator/chrome-dashboard.git
cd chrome-dashboard

# Install dependencies (for development server)
npm install

# Start development server (optional)
npm start

# Or open directly in browser
open newtab.html
```

### Building for Production
The extension is ready for production as-is. For advanced builds:

```bash
# Minify assets (optional)
npm run build

# Package extension for Chrome Web Store
npm run package
```

## 🎨 Customization

### Adding Custom Themes
1. Create a new CSS file in `stylesheets/themes/`
2. Import it in `newtab.html`
3. Add theme selector to settings panel

### Extending Functionality
- **New Widgets**: Add modules in the root directory
- **Search Engines**: Extend `search.js` with new providers
- **Analytics**: Modify `tracking.js` for custom metrics

## 🔒 Privacy & Security

- **Local Storage**: All data stored in browser's local storage
- **No External Servers**: No data sent to third-party services (except chosen search engines)
- **Optional Tracking**: Usage analytics can be completely disabled
- **Secure Icons**: Icon loading uses secure HTTPS sources with fallbacks

## 🐛 Troubleshooting

### Icons Not Loading
- Clear browser cache (`Ctrl+Shift+Delete`)
- Hard refresh the page (`Ctrl+F5`)
- Check if the website has a valid favicon

### Extension Not Working
- Ensure Developer mode is enabled in Chrome
- Reload the extension in `chrome://extensions/`
- Check browser console for error messages

### Weather Not Displaying
- Allow location access when prompted
- Check internet connection
- Verify location services are enabled in browser

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### How to Contribute
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Weather data provided by [Open-Meteo](https://open-meteo.com/)
- Icons sourced from Clearbit, DuckDuckGo, and Google favicon services
- Inspired by modern dashboard design principles

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/TheFakeCreator/chrome-dashboard/issues)
- **Discussions**: [GitHub Discussions](https://github.com/TheFakeCreator/chrome-dashboard/discussions)
- **Email**: [Create an issue for support requests]

---

⭐ **Star this repository if you find it useful!**
