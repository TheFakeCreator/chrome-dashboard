# Chrome Dashboard v2.0 - Modern Architecture

## 🎯 Philosophy

Building a production-quality Chrome Dashboard with:
- **Clean Architecture**: Separation of concerns, SOLID principles
- **Component-Based**: Reusable, testable components
- **Event-Driven**: Decoupled communication via event bus
- **State Management**: Centralized, predictable state
- **Modern ES6+**: Latest JavaScript features
- **Performance-First**: Optimized rendering and minimal overhead

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     USER INTERFACE                       │
│                   (newtab.html + CSS)                    │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                    APP CORE (App.js)                     │
│  ┌─────────────┐  ┌────────────┐  ┌─────────────────┐  │
│  │  EventBus   │  │   State    │  │   Storage       │  │
│  │  (Events)   │  │  Manager   │  │   Manager       │  │
│  └─────────────┘  └────────────┘  └─────────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              COMPONENT LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ GridManager  │  │  BaseWidget  │  │    Router    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                    WIDGETS LAYER                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │  Focus   │ │  Tasks   │ │  Search  │ │  Clock   │   │
│  │  Widget  │ │  Widget  │ │  Widget  │ │  Widget  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                   SERVICES LAYER                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Pomodoro   │  │     Task     │  │    Notes     │  │
│  │    Timer     │  │   Manager    │  │   Manager    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🏗️ Core Modules

### 1. App.js - Application Controller
**Responsibility**: Application initialization and coordination

```javascript
class App {
  constructor() {
    this.eventBus = new EventBus();
    this.stateManager = new StateManager(this.eventBus);
    this.storageManager = new StorageManager();
    this.gridManager = null;
    this.widgets = new Map();
  }

  async init() {
    // Load configuration
    // Initialize core systems
    // Register widgets
    // Setup event listeners
    // Mount UI
  }
}
```

**Key Methods**:
- `init()` - Initialize application
- `registerWidget(widget)` - Register widget
- `loadState()` - Load saved state
- `saveState()` - Persist state

---

### 2. EventBus.js - Event Communication
**Responsibility**: Decouple components via events

```javascript
class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(event, callback) {}
  off(event, callback) {}
  emit(event, data) {}
  once(event, callback) {}
}
```

**Common Events**:
- `app:ready` - App initialized
- `state:changed` - State updated
- `widget:added` - Widget added
- `widget:removed` - Widget removed
- `layout:changed` - Layout modified
- `focus:started` - Focus mode started
- `task:created` - Task created

---

### 3. StateManager.js - State Management
**Responsibility**: Centralized application state

```javascript
class StateManager {
  constructor(eventBus) {
    this.state = {
      user: {},
      settings: {},
      widgets: [],
      layout: {},
      theme: 'dark'
    };
    this.eventBus = eventBus;
  }

  get(path) {}
  set(path, value) {}
  update(updates) {}
  subscribe(path, callback) {}
}
```

**State Structure**:
```javascript
{
  user: {
    name: string,
    preferences: {}
  },
  settings: {
    theme: 'dark' | 'light',
    compactMode: boolean,
    focusMode: {}
  },
  widgets: [
    { id, type, position, config }
  ],
  layout: {
    columns: number,
    gap: number
  }
}
```

---

### 4. StorageManager.js - Data Persistence
**Responsibility**: Chrome storage wrapper

```javascript
class StorageManager {
  async get(keys) {}
  async set(data) {}
  async remove(keys) {}
  async clear() {}
  
  // Sync storage (settings)
  async syncGet(keys) {}
  async syncSet(data) {}
  
  // Listeners
  onChanged(callback) {}
}
```

---

## 🧩 Component System

### BaseWidget.js - Widget Base Class

```javascript
class BaseWidget {
  constructor(config) {
    this.id = config.id;
    this.type = config.type;
    this.position = config.position;
    this.config = config;
    this.element = null;
    this.state = {};
  }

  // Lifecycle hooks
  async init() {}
  render() { return ''; }
  mount(container) {}
  update(newConfig) {}
  destroy() {}
  
  // State management
  setState(updates) {}
  getState() {}
  
  // Events
  emit(event, data) {}
  on(event, callback) {}
}
```

**Widget Lifecycle**:
1. `constructor()` - Create instance
2. `init()` - Load data, setup
3. `render()` - Generate HTML
4. `mount()` - Add to DOM
5. `update()` - Handle changes
6. `destroy()` - Cleanup

---

### GridManager.js - Layout Management

```javascript
class GridManager {
  constructor(container, config) {
    this.container = container;
    this.config = config;
    this.items = [];
  }

  addWidget(widget) {}
  removeWidget(widgetId) {}
  moveWidget(widgetId, newPosition) {}
  saveLayout() {}
  loadLayout() {}
  
  // Drag & drop
  enableDragDrop() {}
  handleDragStart(event) {}
  handleDrop(event) {}
}
```

---

## 🎨 Design System

### CSS Architecture

```
src/styles/
├── core/
│   ├── reset.css          # CSS reset
│   ├── variables.css      # Design tokens
│   └── base.css           # Base styles
├── components/
│   ├── button.css         # Button styles
│   ├── card.css           # Card component
│   ├── modal.css          # Modal component
│   └── ...
├── widgets/
│   ├── widget-base.css    # Base widget styles
│   └── ...
└── themes/
    ├── dark.css           # Dark theme
    └── light.css          # Light theme
```

### Design Tokens

```css
:root {
  /* Colors */
  --primary: #eab308;
  --secondary: #10b981;
  --background: #1e2028;
  --surface: #2a303c;
  --text: #eaeaea;
  --text-secondary: #a0a0a0;
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  
  /* Typography */
  --font-family: 'Segoe UI', system-ui;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.25rem;
  --font-size-xl: 1.5rem;
  
  /* Shadows */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.15);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.2);
  
  /* Border radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
}
```

---

## 🔌 Widget Development Guide

### Creating a New Widget

1. **Extend BaseWidget**:
```javascript
import { BaseWidget } from '../components/BaseWidget.js';

export class ClockWidget extends BaseWidget {
  constructor(config) {
    super(config);
    this.time = null;
    this.interval = null;
  }

  async init() {
    // Initialize widget
    this.updateTime();
  }

  render() {
    return `
      <div class="clock-widget">
        <div class="clock-time">${this.time}</div>
      </div>
    `;
  }

  mount(container) {
    container.innerHTML = this.render();
    this.element = container.querySelector('.clock-widget');
    this.startClock();
  }

  destroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}
```

2. **Register Widget**:
```javascript
app.registerWidget('clock', ClockWidget);
```

3. **Add to Dashboard**:
```javascript
app.addWidget({
  type: 'clock',
  position: { x: 0, y: 0, w: 2, h: 1 }
});
```

---

## 📦 Module Structure

```
src/
├── core/
│   ├── App.js                    # Main application
│   ├── EventBus.js               # Event system
│   ├── StateManager.js           # State management
│   ├── StorageManager.js         # Storage wrapper
│   ├── ConfigManager.js          # Configuration
│   └── Router.js                 # Routing (if needed)
│
├── components/
│   ├── BaseWidget.js             # Widget base class
│   ├── BaseComponent.js          # Component base
│   ├── GridManager.js            # Grid layout
│   ├── GridItem.js               # Grid item
│   └── WidgetRegistry.js         # Widget management
│
├── widgets/
│   ├── ClockWidget.js
│   ├── WeatherWidget.js
│   ├── SearchWidget.js
│   ├── QuickLinksWidget.js
│   ├── FocusWidget.js
│   ├── TaskWidget.js
│   └── NotesWidget.js
│
├── services/
│   ├── PomodoroTimer.js
│   ├── TaskManager.js
│   ├── NotesManager.js
│   ├── FocusStats.js
│   └── SiteBlocker.js
│
├── utils/
│   ├── dom.js                    # DOM utilities
│   ├── date.js                   # Date utilities
│   ├── storage.js                # Storage helpers
│   └── validators.js             # Validators
│
└── styles/
    └── [CSS architecture as above]
```

---

## 🚀 Implementation Plan

### Week 1: Core Foundation
1. Create App.js, EventBus, StateManager
2. Setup StorageManager
3. Build component lifecycle system
4. Create design system CSS

### Week 2: Grid & Widgets
1. Implement GridManager
2. Create BaseWidget class
3. Build first widgets (Clock, Weather, Search)
4. Test layout system

### Week 3: Features
1. Implement Focus Mode widget
2. Add Task Management
3. Create Notes widget
4. Polish UI/UX

---

## 📝 Best Practices

1. **Single Responsibility**: Each module has one job
2. **Dependency Injection**: Pass dependencies, don't create
3. **Event-Driven**: Use EventBus for communication
4. **Immutable State**: Don't mutate state directly
5. **Error Handling**: Try/catch with user-friendly messages
6. **Performance**: Debounce, throttle, lazy load
7. **Testing**: Write tests for core functionality
8. **Documentation**: JSDoc all public APIs

---

*This architecture supports scalability, maintainability, and team collaboration.*
