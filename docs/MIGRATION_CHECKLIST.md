# Migration Checklist

This document tracks the migration of files from the old structure to the new organized structure.

## ✅ Completed

- [x] Created new folder structure
- [x] Setup pnpm package manager
- [x] Configured ESLint and Prettier
- [x] Setup Husky git hooks
- [x] Created Copilot instructions
- [x] Created comprehensive roadmap
- [x] Updated .gitignore
- [x] Created build scripts

## 📋 Pending Migrations

### High Priority
- [ ] Move JavaScript files to src/ structure
- [ ] Move CSS files to src/styles/
- [ ] Update import paths in all files
- [ ] Test extension with new structure
- [ ] Update HTML files to use new paths

### Medium Priority
- [ ] Create proper module exports
- [ ] Implement configuration management
- [ ] Setup testing framework
- [ ] Write initial tests
- [ ] Create documentation for each module

### Low Priority
- [ ] Optimize build process
- [ ] Add source maps
- [ ] Setup hot reload for development
- [ ] Create development utilities

## 🗂️ File Migration Map

### JavaScript Files

| Current Location | New Location | Status |
|-----------------|--------------|--------|
| `main.js` | `src/core/main.js` | ⏳ Pending |
| `sections.js` | `src/features/sections/SectionManager.js` | ⏳ Pending |
| `search.js` | `src/features/search/SearchEngine.js` | ⏳ Pending |
| `weather.js` | `src/features/widgets/weather/Weather.js` | ⏳ Pending |
| `clock.js` | `src/features/widgets/clock/Clock.js` | ⏳ Pending |
| `tracking.js` | `src/features/analytics/Tracking.js` | ⏳ Pending |
| `settings.js` | `src/core/Settings.js` | ⏳ Pending |
| `modal.js` | `src/utils/Modal.js` | ⏳ Pending |
| `customDropdown.js` | `src/utils/Dropdown.js` | ⏳ Pending |
| `ai.js` | `src/features/search/AISearch.js` | ⏳ Pending |
| `tabGroups.js` | `src/features/tabs/TabGroups.js` | ⏳ Pending |
| `popup.js` | `src/core/Popup.js` | ⏳ Pending |
| `background.js` | `src/core/Background.js` | ⏳ Pending |
| `dev-tools.js` | `scripts/dev-tools.js` | ⏳ Pending |

### CSS Files

| Current Location | New Location | Status |
|-----------------|--------------|--------|
| `stylesheets/base.css` | `src/styles/base.css` | ⏳ Pending |
| `stylesheets/header.css` | `src/styles/components/header.css` | ⏳ Pending |
| `stylesheets/sections.css` | `src/styles/components/sections.css` | ⏳ Pending |
| `stylesheets/modal.css` | `src/styles/components/modal.css` | ⏳ Pending |
| `stylesheets/search.css` | `src/styles/features/search.css` | ⏳ Pending |
| `stylesheets/settings.css` | `src/styles/features/settings.css` | ⏳ Pending |
| `stylesheets/responsive.css` | `src/styles/responsive.css` | ⏳ Pending |
| `stylesheets/customDropdown.css` | `src/styles/components/dropdown.css` | ⏳ Pending |
| `stylesheets/card-popup.css` | `src/styles/components/card-popup.css` | ⏳ Pending |
| `stylesheets/form.css` | `src/styles/components/form.css` | ⏳ Pending |

## 🔄 Migration Steps

### For Each JavaScript File:

1. **Create new file** in appropriate location
2. **Add proper module structure**:
   ```javascript
   /**
    * @module FeatureName
    * @description Brief description
    */
   
   export class ClassName {
     // Implementation
   }
   ```
3. **Update imports** to use ES6 modules
4. **Add JSDoc comments** for functions
5. **Move file** and update references
6. **Test** functionality
7. **Mark as completed** in this checklist

### For Each CSS File:

1. **Create new file** in src/styles/
2. **Review and organize** selectors
3. **Add CSS variables** where appropriate
4. **Update HTML references**
5. **Test** styling
6. **Mark as completed** in this checklist

## 🧪 Testing After Migration

After each file migration:

- [ ] Extension loads without errors
- [ ] Feature functionality works as before
- [ ] No console errors
- [ ] Styling is intact
- [ ] Performance is maintained

## 📝 Notes

- Keep old files until new structure is fully tested
- Update import paths incrementally
- Document any breaking changes
- Test in development branch first
- Get feedback before committing large changes

---

*This is a living document. Update as migration progresses.*
