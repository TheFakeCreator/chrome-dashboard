# Testing Guide - Chrome Dashboard v2.0

## How to Load and Test the Extension

### Step 1: Load Extension in Chrome

1. **Open Chrome Extensions Page**
   - Go to `chrome://extensions/`
   - Or click the puzzle icon → "Manage Extensions"

2. **Enable Developer Mode**
   - Toggle "Developer mode" in the top-right corner

3. **Load Unpacked Extension**
   - Click "Load unpacked"
   - Navigate to: `d:\Sanskar\programming\projects\chrome-dashboard`
   - Select the folder and click "Select Folder"

4. **Verify Installation**
   - You should see "Modern Dashboard New Tab" in your extensions list
   - Check that there are no errors

### Step 2: Test the Dashboard

1. **Open a New Tab**
   - Press `Ctrl+T` or click the "+" button
   - You should see the new dashboard instead of the default Chrome new tab

2. **What You Should See**
   - Loading screen briefly
   - Empty state with "Welcome to Your Dashboard" message
   - Header with theme toggle and settings buttons
   - Footer with version info
   - Clean, modern design with glassmorphism effects

### Step 3: Open Developer Console

1. **Press F12** to open DevTools
2. **Check Console Tab** for logs:
   ```
   [Main] Dashboard module loaded
   [Main] Starting Chrome Dashboard v2.0
   [Main] Initialization sequence started
   [App] Initializing Chrome Dashboard v2.0.0
   [App] Core systems initialized
   [App] Configuration loaded
   [App] State initialized
   [App] Event listeners setup complete
   [App] Theme applied: dark (or light)
   [App] User data loaded
   [App] Initialization complete
   [Main] App initialized successfully
   ```

3. **Check for Errors**
   - There should be no red errors
   - Only informational logs in blue/gray

### Step 4: Test Features

#### Theme Toggle
1. Click the sun/moon icon in the header
2. Theme should switch between light and dark
3. Check console: `[Main] Theme changed to: dark` or `light`

#### Settings Button
1. Click the gear icon
2. Check console: `Settings button clicked`
3. (Settings modal not yet implemented)

#### Check Global Object
In the console, type:
```javascript
__dashboard
```
You should see:
```javascript
{
  app: App { ... },
  version: '2.0.0-alpha'
}
```

#### Check App Systems
```javascript
// Check EventBus
__dashboard.app.eventBus.eventNames()

// Check State
__dashboard.app.stateManager.getState()

// Check Config
__dashboard.app.configManager.getAll()
```

### Step 5: Verify Storage

1. **Open Application Tab** in DevTools
2. **Navigate to Storage → Local Storage**
3. You should see keys like:
   - `dashboard_config`
   - `dashboard_settings`

### Step 6: Test Theme Persistence

1. Toggle theme to dark
2. Close the tab
3. Open a new tab
4. Theme should remain dark (persisted)

## Expected Behavior

### ✅ What Should Work
- Loading screen appears and disappears
- Dashboard loads without errors
- Header, main content, and footer display correctly
- Theme toggle works and persists
- Console shows clean initialization logs
- Empty state displays nicely
- Responsive design (try resizing window)

### ⚠️ What's Not Yet Implemented
- Widget system (empty state shown)
- Settings modal
- Search functionality
- Actual widgets (Clock, Weather, etc.)
- Grid layout management
- Drag and drop

## Troubleshooting

### Problem: Extension Won't Load
**Solution:**
- Check that manifest.json is valid
- Make sure all files exist
- Check Chrome DevTools for specific errors

### Problem: Blank Page
**Solution:**
- Open DevTools (F12) and check Console
- Look for import/module errors
- Check Network tab for failed file loads

### Problem: Theme Not Working
**Solution:**
- Check console for errors
- Verify CSS files are loading (Network tab)
- Check that design-tokens.css is loaded

### Problem: Console Errors about Chrome API
**Solution:**
- Make sure you're testing as an extension (chrome://extensions/)
- Not testing as a regular webpage (file://)
- Chrome APIs only work in extension context

## Debugging Tips

### View All State
```javascript
console.table(__dashboard.app.stateManager.getState())
```

### View All Config
```javascript
console.table(__dashboard.app.configManager.getAll())
```

### Emit Test Event
```javascript
__dashboard.app.eventBus.emit('test:event', { data: 'Hello!' })
```

### Subscribe to Events
```javascript
__dashboard.app.eventBus.on('*', (data) => {
  console.log('Event fired:', data)
})
```

### Check Component Registry
```javascript
console.log('Components:', __dashboard.app.components)
console.log('Widgets:', __dashboard.app.widgets)
```

## Next Steps

Once you verify the foundation works:

1. ✅ **Foundation Working** - You're seeing the dashboard
2. 🔄 **Create First Widget** - Clock widget to see it in action
3. 🔄 **Add Grid System** - GridManager for widget layout
4. 🔄 **Build More Widgets** - Weather, Search, Tasks, etc.

## Success Criteria

The foundation is working if:
- ✅ New tab shows dashboard (not Chrome default)
- ✅ No console errors
- ✅ Theme toggle works
- ✅ Empty state displays
- ✅ All initialization logs appear
- ✅ __dashboard global object exists
- ✅ Design looks modern and clean

---

**Ready to Test?** Load the extension and open a new tab! 🚀

If you see the dashboard with no errors, **Phase 1 is successfully deployed!** 🎉
