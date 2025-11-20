# Smart Widgets Dashboard - Quick Start Guide

## 🎯 What is it?

The Smart Widgets Dashboard transforms your Chrome new tab into a fully customizable workspace with drag-and-drop widgets, preset layouts, and a beautiful widget library.

---

## 🚀 Getting Started

### Opening the Widget Store

**Keyboard Shortcut**: `Ctrl + Shift + K` (Windows/Linux) or `Cmd + Shift + K` (Mac)

**Programmatically**:
```javascript
app.eventBus.emit('widget-store:open');
```

---

## 📦 Adding Widgets

1. Press `Ctrl + Shift + K` to open the Widget Store
2. Browse widgets by category or search
3. Click the "Add" button on any widget
4. The widget appears on your dashboard

**Available Categories**:
- **All** - Show all widgets
- **Time** - Clock, Weather
- **Productivity** - Focus timer, Tasks
- **Navigation** - Quick Links, Search
- **Utilities** - Extension Control, Settings

---

## 🎨 Rearranging Widgets

### Drag & Drop
1. **Hover** over any widget
2. The **drag handle** appears (top-right corner with grip icon)
3. **Click and drag** to move the widget
4. **Drop** in the desired position
5. Layout **saves automatically**

### Visual Feedback
- Widget becomes semi-transparent while dragging
- Blue indicators show where it will be placed
- Smooth animations for placement

---

## 📐 Layout Presets

### Built-in Presets

#### 💼 Work
Professional productivity setup with focus timer, quick links, and extension control.

#### 📚 Study
Focused learning environment with large focus timer and minimal distractions.

#### 🏠 Personal
Relaxed browsing setup with emphasis on quick links and weather.

#### ✨ Minimal
Clean and simple - just the essentials (Search, Clock, Weather, Quick Links).

#### ⚡ Productivity
Maximum efficiency with all productivity tools front and center.

#### 🎨 Creative
Inspiration-focused layout for designers and creators.

### Applying a Preset

**Programmatically**:
```javascript
await app.widgetPresets.apply('work');
// or: 'study', 'personal', 'minimal', 'productivity', 'creative'
```

---

## 🌟 Custom Presets

### Saving Your Layout

Arrange your widgets exactly how you like, then save it:

```javascript
await app.widgetPresets.saveCustomPreset(
  'My Perfect Layout',           // Name
  'Custom setup for evening',    // Description
  '🌙'                            // Icon
);
```

### Managing Custom Presets

**Delete a preset**:
```javascript
await app.widgetPresets.deleteCustomPreset('custom-123456');
```

**Export preset** (to share or backup):
```javascript
const json = app.widgetPresets.export('custom-123456');
// Copy this JSON to share with others
```

**Import preset**:
```javascript
await app.widgetPresets.import(jsonString);
```

---

## 🔧 Advanced Usage

### Programmatic Widget Management

#### Add a widget
```javascript
const widget = await app.widgetRegistry.create('clock', {
  settings: { format: '24h', showSeconds: true },
  layout: { width: 2, height: 1 }
});
app.gridManager.addWidget(widget);
```

#### Remove a widget
```javascript
app.gridManager.removeWidget('widget-clock-123');
```

#### Get all widgets
```javascript
const widgets = app.widgetRegistry.getDefinitions();
```

#### Search widgets
```javascript
const results = app.widgetRegistry.search('time');
```

---

## 📊 Widget Registry API

### Registering a New Widget

```javascript
app.widgetRegistry.register('mywidget', MyWidgetClass, {
  title: 'My Widget',
  icon: '🎯',
  description: 'Does something awesome',
  category: 'productivity',
  version: '1.0.0',
  defaultSettings: {
    enabled: true
  },
  defaultLayout: {
    width: 2,
    height: 1
  }
});
```

### Widget Categories
- `time` - Time and date widgets
- `productivity` - Productivity tools
- `navigation` - Navigation and links
- `utilities` - Utility widgets
- `general` - General purpose

---

## 🎯 Grid System

### Responsive Breakpoints

The grid automatically adapts to screen size:

| Breakpoint | Width | Columns |
|------------|-------|---------|
| xs | ≤640px | 1 |
| sm | 641-768px | 2 |
| md | 769-1024px | 4 |
| lg | 1025-1280px | 6 |
| xl | 1281-1536px | 8 |
| 2xl | ≥1537px | 12 |

### Widget Sizing

Widgets span columns and rows:
- **Width**: 1-12 columns
- **Height**: 1-4 rows (auto-grows if needed)

```javascript
widget.updateLayout({
  width: 6,   // Spans 6 columns
  height: 2   // Spans 2 rows
});
```

---

## 🎨 Customization

### Widget Settings

Each widget has its own settings:

```javascript
await widget.updateSettings({
  format: '24h',
  showSeconds: true,
  theme: 'dark'
});
```

### Layout Persistence

Your layout is automatically saved to Chrome storage:
- Every time you move a widget
- When you add or remove widgets
- When you apply a preset

**Manual save**:
```javascript
await app.gridManager.saveLayout();
```

**Manual load**:
```javascript
await app.gridManager.loadLayout();
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+K` | Open Widget Store |
| `Escape` | Close Widget Store |
| `/` | Focus search (when in Widget Store) |

---

## 🐛 Troubleshooting

### Widget Store won't open
- Make sure you're using `Ctrl+Shift+K` (not just `Ctrl+K`)
- Check browser console for errors

### Widgets not saving position
- Check Chrome storage quota
- Verify storage permissions in manifest

### Drag and drop not working
- Ensure widgets have the drag handle visible on hover
- Check for JavaScript errors in console

---

## 📚 API Reference

### App Instance

```javascript
app.widgetRegistry   // Widget registration system
app.gridManager      // Grid layout system
app.widgetPresets    // Preset management
```

### Events

```javascript
// Widget Store events
app.eventBus.on('widget-store:open', () => { });
app.eventBus.on('widget-store:close', () => { });

// Widget events
app.eventBus.on('widget:added', ({ widget }) => { });
app.eventBus.on('widget:removed', ({ widgetId }) => { });

// Grid events
app.eventBus.on('grid:layout-saved', ({ layout }) => { });
app.eventBus.on('grid:drag-start', ({ widget }) => { });
app.eventBus.on('grid:drag-end', () => { });

// Preset events
app.eventBus.on('widget-presets:applied', ({ presetId }) => { });
app.eventBus.on('widget-presets:saved', ({ preset }) => { });
```

---

## 💡 Tips & Best Practices

1. **Start with a preset** - Choose a built-in preset that matches your workflow
2. **Customize gradually** - Add/remove widgets one at a time to find your ideal layout
3. **Save frequently** - Create custom presets for different times of day or tasks
4. **Use categories** - Keep related widgets together for easier access
5. **Mobile-friendly** - The grid automatically adapts to smaller screens
6. **Keyboard shortcuts** - Learn `Ctrl+Shift+K` for quick access

---

## 🎉 Examples

### Morning Routine Layout
```javascript
await app.widgetPresets.apply('minimal');
// Clean start with just essentials
```

### Deep Work Session
```javascript
await app.widgetPresets.apply('productivity');
// Focus timer + essential tools
```

### Creative Flow
```javascript
await app.widgetPresets.apply('creative');
// Inspiration boards + tools
```

---

## 📖 Further Reading

- [Feature 8 Implementation Summary](.github/FEATURE_8_SUMMARY.md)
- [Full Roadmap](ROADMAP.md)
- [Contributing Guidelines](CONTRIBUTING.md)

---

**Questions?** Open an issue on GitHub or check the documentation.

**Happy customizing!** 🚀
