# GitHub Copilot Instructions for Chrome Dashboard Project

## Project Overview
Chrome Dashboard is a productivity-focused Chrome extension that replaces the default new tab with a customizable, feature-rich dashboard designed to maximize user efficiency and workflow optimization.

## Development Philosophy

### Core Principles
1. **Industry-Grade Best Practices**: Follow established patterns and conventions
2. **Scalability**: Design for growth and feature expansion
3. **Maintainability**: Write clean, documented, and testable code
4. **Performance**: Optimize for speed and minimal resource usage
5. **User-Centric**: Prioritize productivity and user experience
6. **Privacy-First**: Keep all data local and respect user privacy

## Technical Standards

### Code Quality
- **Clean Code**: Follow SOLID principles and DRY methodology
- **Naming Conventions**: 
  - Use camelCase for variables and functions
  - Use PascalCase for classes and components
  - Use UPPER_SNAKE_CASE for constants
  - Use descriptive, self-documenting names
- **Comments**: Write meaningful comments for complex logic, not obvious code
- **Error Handling**: Always handle errors gracefully with user-friendly messages
- **Async Operations**: Use async/await over callbacks, handle rejections properly

### File Organization
```
chrome-dashboard/
├── src/                    # Source code (development)
│   ├── core/              # Core functionality
│   ├── features/          # Feature modules
│   ├── utils/             # Helper utilities
│   ├── styles/            # CSS/styling
│   ├── assets/            # Images, icons, fonts
│   └── types/             # TypeScript types (if applicable)
├── dist/                  # Production build (ignored in git)
├── releases/              # Release packages
├── tests/                 # Test files
├── docs/                  # Documentation
└── scripts/               # Build and utility scripts
```

### Package Management
- **Use pnpm**: Always use `pnpm` for package management (faster, more efficient than npm)
- **No Direct package.json Edits**: Install dependencies via terminal commands only
- **Dependency Management**:
  - Use `pnpm add <package>` for production dependencies
  - Use `pnpm add -D <package>` for dev dependencies
  - Keep dependencies up-to-date with `pnpm update`
  - Audit security regularly with `pnpm audit`

### Git Workflow
- **Branch Strategy**:
  - `main`: Production-ready code
  - `develop`: Integration branch for features
  - `feature/*`: Individual feature development
  - `bugfix/*`: Bug fixes
  - `release/*`: Release preparation
- **Commit Messages**: Use conventional commits (feat:, fix:, docs:, style:, refactor:, test:, chore:)
- **Pull Requests**: Always review code before merging

### Testing Standards
- Write unit tests for utility functions
- Write integration tests for features
- Test edge cases and error conditions
- Maintain minimum 80% code coverage
- Use descriptive test names: `it('should handle empty input gracefully')`

### Performance Guidelines
- Minimize DOM manipulations (batch updates)
- Use event delegation for dynamic content
- Implement lazy loading for heavy components
- Optimize images and assets
- Use CSS transforms over position/size changes
- Debounce/throttle frequent operations (search, scroll)

### Security Practices
- Sanitize all user inputs
- Use Content Security Policy (CSP)
- Avoid eval() and inline scripts
- Validate data before storage
- Use HTTPS for all external requests
- Follow Chrome extension security best practices

### CSS/Styling
- Use CSS custom properties (variables) for theming
- Follow BEM naming convention for classes
- Mobile-first responsive design
- Use CSS Grid and Flexbox for layouts
- Avoid !important unless absolutely necessary
- Keep specificity low
- Use CSS modules or scoped styles

### JavaScript Standards
- Use ES6+ features
- Prefer const over let, avoid var
- Use template literals for string concatenation
- Use destructuring for cleaner code
- Use spread operator for array/object operations
- Implement proper module imports/exports
- Avoid global variables

### Documentation
- README.md with clear setup instructions
- API documentation for public functions
- Inline JSDoc comments for functions
- Changelog for version tracking
- Architecture decisions documented
- User guides for features

## Feature Development Workflow

### 1. Planning Phase
- Define feature requirements clearly
- Create technical specification
- Design data models and API contracts
- Plan testing strategy

### 2. Implementation Phase
- Create feature branch from `develop`
- Implement core functionality first
- Write tests alongside code
- Follow TDD when appropriate
- Commit frequently with clear messages

### 3. Testing Phase
- Run all tests locally
- Perform manual testing
- Test edge cases
- Verify accessibility
- Check performance impact

### 4. Review Phase
- Self-review code
- Run linters and formatters
- Update documentation
- Create pull request with detailed description
- Address review comments

### 5. Release Phase
- Merge to develop after approval
- Test in development environment
- Create release branch
- Build production version
- Tag version in git
- Deploy to production

## Chrome Extension Specific

### Manifest V3 Compliance
- Use service workers instead of background pages
- Follow CSP guidelines
- Use declarative APIs where possible
- Handle permissions properly

### Storage
- Use chrome.storage.sync for user settings
- Use chrome.storage.local for large data
- Implement data migration strategies
- Handle storage quota limits

### Performance
- Minimize background script operations
- Use alarms API for scheduled tasks
- Optimize content script injection
- Lazy load optional features

## Productivity Focus

### User Experience
- Keyboard shortcuts for common actions
- Fast, responsive UI (< 100ms interaction feedback)
- Intelligent defaults
- Progressive disclosure of features
- Clear visual hierarchy
- Accessible to all users (WCAG 2.1 AA)

### Data Management
- Auto-save user changes
- Implement undo/redo where appropriate
- Export/import functionality
- Data backup mechanisms
- Sync across devices (chrome.storage.sync)

## Build and Release

### Build Process
```bash
# Development build
pnpm run dev

# Production build
pnpm run build

# Run tests
pnpm test

# Lint code
pnpm run lint

# Format code
pnpm run format
```

### Release Checklist
- [ ] Version bump in manifest.json and package.json
- [ ] Changelog updated
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Browser compatibility tested
- [ ] Build production package
- [ ] Create GitHub release with notes
- [ ] Tag version in git

## Tools and Libraries

### Preferred Stack
- **Package Manager**: pnpm
- **Build Tool**: Vite or Rollup (for bundling)
- **Testing**: Jest or Vitest
- **Linting**: ESLint with recommended configs
- **Formatting**: Prettier
- **Type Checking**: JSDoc or TypeScript
- **CSS Processing**: PostCSS
- **Documentation**: JSDoc, Markdown

### Code Quality Tools
```bash
# Install dev dependencies
pnpm add -D eslint prettier husky lint-staged

# Setup pre-commit hooks
pnpm add -D husky
pnpm exec husky init
```

## Continuous Improvement

### Regular Maintenance
- Update dependencies monthly
- Review and refactor old code
- Monitor performance metrics
- Gather user feedback
- Track and fix bugs promptly
- Optimize bundle size

### Code Reviews
- Check for code smells
- Verify error handling
- Ensure test coverage
- Review performance impact
- Validate accessibility
- Check security implications

## Communication

### Issue Tracking
- Create detailed issue descriptions
- Include reproduction steps for bugs
- Label issues appropriately
- Link related issues and PRs
- Keep discussions focused

### Documentation Updates
- Update README for new features
- Add examples for complex features
- Document breaking changes
- Maintain API documentation
- Keep changelog current

## Remember

> **"We build one feature at a time, completely and effectively, just like a real dev team."**

- Focus on quality over quantity
- Complete features fully before moving on
- Test thoroughly at each step
- Document as you go
- Refactor continuously
- Communicate clearly
- Respect the codebase and its future maintainers

---

*Last Updated: November 10, 2025*
*Version: 2.0.0*
