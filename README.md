# Chrome Dashboard

A modern, modular new tab dashboard for Chrome with:
- Customizable sections and cards
- Weather, clock, and location
- AI search bar with gradient border
- Tab groups
- Responsive design
- Modular CSS and JS

## Features
- Add, edit, and delete sections and cards
- Search with Google, Bing, DuckDuckGo, YouTube, GitHub
- Ask AI (ChatGPT, Gemini, Claude)
- Weather and location detection
- Settings modal for personalization


## Getting Started

### Local Preview
1. Clone the repo:
   ```sh
   git clone https://github.com/TheFakeCreator/chrome-dashboard.git
   ```
2. Open `chrome-dashboard/newtab.html` directly in Chrome to preview the dashboard.

### Use as a Chrome Extension (New Tab Replacement)
1. Go to `chrome://extensions/` in Chrome.
2. Enable "Developer mode" (top right).
3. Click "Load unpacked" and select the `chrome-dashboard` folder.
4. In the extension settings, set this extension as your new tab page (if supported by your manifest).
5. Open a new tab to see your dashboard.

### Customization
- Edit sections, cards, and settings directly in the dashboard UI.
- Modify CSS or JS modules for advanced customization.

## Project Structure
```
chrome-dashboard/
├── stylesheets/
│   ├── base.css
│   ├── card-popup.css
│   ├── form.css
│   ├── header.css
│   ├── modal.css
│   ├── responsive.css
│   ├── search.css
│   ├── sections.css
│   ├── settings.css
│   ├── style.css
├── ai.js
├── clock.js
├── COPILOT.md
├── icon128.png
├── main.js
├── manifest.json
├── modal.js
├── newtab.html
├── README.md
├── script.js
├── search.js
├── sections.js
├── settings.js
├── tabGroups.js
├── weather.js
```

## Contributing
Pull requests and suggestions are welcome!

## License
MIT
