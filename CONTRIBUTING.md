# Contributing to Chrome Dashboard

Thank you for your interest in contributing to Chrome Dashboard! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- Chrome browser
- Git
- Basic knowledge of HTML, CSS, and JavaScript

### Setting Up Development Environment

1. **Fork the Repository**
   - Click the "Fork" button on the GitHub repository page
   - Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/chrome-dashboard.git
   cd chrome-dashboard
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Load Extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the project folder

4. **Start Development**
   - Make your changes
   - Reload the extension in Chrome to test
   - Open a new tab to see your changes

## 📋 How to Contribute

### 🐛 Reporting Bugs

Before creating a bug report, please:
- Check if the issue already exists in [GitHub Issues](https://github.com/TheFakeCreator/chrome-dashboard/issues)
- Test with a fresh browser profile to rule out conflicts

When creating a bug report, include:
- **Browser version** and operating system
- **Extension version** (from manifest.json)
- **Steps to reproduce** the issue
- **Expected behavior** vs **actual behavior**
- **Screenshots** or **console errors** if applicable

### 💡 Suggesting Features

Feature requests are welcome! Please:
- Check existing issues to avoid duplicates
- Explain the **problem** your feature would solve
- Describe your **proposed solution**
- Consider **alternative solutions**
- Provide **mockups** or examples if applicable

### 🔧 Code Contributions

#### Types of Contributions We Welcome
- Bug fixes
- New features
- Performance improvements
- UI/UX enhancements
- Documentation improvements
- Test coverage improvements
- Code refactoring

#### Development Workflow

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Make Changes**
   - Follow the existing code style
   - Write clear, descriptive commit messages
   - Test your changes thoroughly

3. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add new search engine integration"
   # or
   git commit -m "fix: resolve weather widget loading issue"
   ```

4. **Push and Create Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```
   - Go to GitHub and create a Pull Request
   - Fill out the PR template completely
   - Link any related issues

## 📝 Code Style Guidelines

### JavaScript
- Use ES6+ features when appropriate
- Use `const` for immutable values, `let` for mutable
- Use descriptive variable and function names
- Add comments for complex logic
- Prefer template literals over string concatenation

**Example:**
```javascript
// Good
const createCardElement = (item) => {
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <img src="${item.icon}" alt="${item.name}">
    <span class="card-name">${item.name}</span>
  `;
  return card;
};

// Avoid
function makeCard(i) {
  var c = document.createElement('div');
  c.className = 'card';
  c.innerHTML = '<img src="' + i.icon + '"><span>' + i.name + '</span>';
  return c;
}
```

### CSS
- Use consistent naming conventions (kebab-case)
- Group related properties together
- Use CSS custom properties for theme values
- Write mobile-first responsive CSS

**Example:**
```css
/* Good */
.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  
  padding: var(--spacing-md);
  background: var(--card-background);
  border-radius: var(--border-radius);
  
  transition: transform 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
}
```

### HTML
- Use semantic HTML elements
- Include proper accessibility attributes
- Keep structure clean and readable

## 🧪 Testing

### Manual Testing
- Test your changes in Chrome
- Verify responsive design on different screen sizes
- Test with different user data scenarios
- Check browser console for errors

### Automated Testing
Currently, the project relies on manual testing. Contributions to add automated testing are welcome!

## 📚 Project Structure

Understanding the codebase:

```
chrome-dashboard/
├── stylesheets/          # Modular CSS files
│   ├── base.css          # Core variables and utilities
│   ├── header.css        # Top navigation styling
│   ├── sections.css      # Card grid and sections
│   └── ...
├── newtab.html          # Main dashboard page
├── popup.html           # Extension popup
├── manifest.json        # Chrome extension config
├── main.js              # Application initialization
├── sections.js          # Section/card management
├── search.js            # Search functionality
├── weather.js           # Weather widget
├── tracking.js          # Usage analytics
├── settings.js          # Configuration UI
└── background.js        # Extension background script
```

### Key Components

- **Sections**: Manage collections of cards (apps, websites, bookmarks)
- **Search**: Multi-engine search with AI integration
- **Weather**: Location-based weather display
- **Settings**: User preferences and customization
- **Tracking**: Privacy-focused usage analytics

## 🎯 Focus Areas for Contributions

### High Priority
- Performance optimizations
- Accessibility improvements
- Browser compatibility fixes
- Security enhancements

### Medium Priority
- New search engine integrations
- Additional weather providers
- UI/UX improvements
- Mobile responsiveness

### Future Ideas
- Sync across devices
- Plugin system
- Advanced themes
- Keyboard shortcuts

## 📋 Pull Request Guidelines

### Before Submitting
- [ ] Code follows the style guidelines
- [ ] Changes are tested in Chrome
- [ ] No console errors or warnings
- [ ] README updated if needed
- [ ] Commits are descriptive and logical

### Pull Request Template
Your PR should include:

**Description**
Brief description of changes made

**Type of Change**
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

**Testing**
- [ ] Tested in Chrome
- [ ] Tested responsive design
- [ ] No console errors

**Screenshots**
Include screenshots for UI changes

## 🏆 Recognition

Contributors will be:
- Listed in the project's contributors section
- Mentioned in release notes for significant contributions
- Invited to join the core team for ongoing contributors

## ❓ Questions?

- **General questions**: Create a [GitHub Discussion](https://github.com/TheFakeCreator/chrome-dashboard/discussions)
- **Bug reports**: Create an [Issue](https://github.com/TheFakeCreator/chrome-dashboard/issues)
- **Feature requests**: Create an [Issue](https://github.com/TheFakeCreator/chrome-dashboard/issues) with the "enhancement" label

Thank you for contributing to Chrome Dashboard! 🎉
