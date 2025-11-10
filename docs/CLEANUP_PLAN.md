# Cleanup Plan for Chrome Dashboard v2.0

## 🎯 Objective
Move existing files to the new organized structure while maintaining a working extension during transition.

## 📋 Phase 1: Move JavaScript Files to src/

### Core Files
- [x] Create folders
- [ ] Move `main.js` → `src/core/`
- [ ] Move `background.js` → `src/core/`
- [ ] Move `popup.js` → `src/core/`
- [ ] Move `settings.js` → `src/core/`

### Feature Files
- [ ] Create `src/features/sections/` → Move `sections.js`
- [ ] Create `src/features/search/` → Move `search.js`, `ai.js`
- [ ] Create `src/features/widgets/weather/` → Move `weather.js`
- [ ] Create `src/features/widgets/clock/` → Move `clock.js`
- [ ] Create `src/features/tabs/` → Move `tabGroups.js`
- [ ] Create `src/features/analytics/` → Move `tracking.js`

### Utility Files
- [ ] Move `modal.js` → `src/utils/`
- [ ] Move `customDropdown.js` → `src/utils/`

### Development Files
- [ ] Move `dev-tools.js` → `scripts/`

## 📋 Phase 2: Move CSS Files to src/styles/

- [ ] Move `stylesheets/base.css` → `src/styles/`
- [ ] Move `stylesheets/header.css` → `src/styles/components/`
- [ ] Move `stylesheets/sections.css` → `src/styles/components/`
- [ ] Move `stylesheets/modal.css` → `src/styles/components/`
- [ ] Move `stylesheets/search.css` → `src/styles/features/`
- [ ] Move `stylesheets/settings.css` → `src/styles/features/`
- [ ] Move `stylesheets/responsive.css` → `src/styles/`
- [ ] Move `stylesheets/customDropdown.css` → `src/styles/components/`
- [ ] Move `stylesheets/card-popup.css` → `src/styles/components/`
- [ ] Move `stylesheets/form.css` → `src/styles/components/`

## 📋 Phase 3: Move Assets

- [ ] Move icon files to `src/assets/icons/`
- [ ] Clean up root directory

## 📋 Phase 4: Update References

- [ ] Update `newtab.html` to reference new paths
- [ ] Update `popup.html` to reference new paths
- [ ] Update `manifest.json` if needed
- [ ] Test extension loads correctly

## 📋 Phase 5: Final Cleanup

- [ ] Remove empty `stylesheets/` folder
- [ ] Remove old zip file from root
- [ ] Verify all files are in correct locations
- [ ] Test all features work

## 🗑️ Files to Keep in Root
- `manifest.json`
- `newtab.html`
- `popup.html`
- `icon128.png` (until moved to src/assets/)
- Configuration files (.eslintrc.js, .prettierrc.json, etc.)
- Documentation files (README.md, CHANGELOG.md, etc.)

## 🗑️ Files/Folders to Remove
- [ ] `chrome-dashboard-v0.1.0-alpha.zip` (old release)
- [ ] Old `.js` files from root (after moving)
- [ ] Old `stylesheets/` folder (after moving)

---

*Execute this plan step by step*
