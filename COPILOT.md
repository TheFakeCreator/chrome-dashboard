Create a Chrome extension that overrides the default new tab page.

Tech:
- Use manifest version 3
- Vanilla JS, HTML, CSS only (no frameworks)

Files:
- manifest.json
- newtab.html
- style.css
- script.js

UI Design (modern, dark theme):
1. **Welcome Header**
   - Welcome message (e.g., “Welcome, Sanskar 👋”)
   - Real-time clock (updates every second)

2. **Search Bar (Center or Top)**
   - Input field for search queries
   - Dropdown to select search engine: Google, Bing, DuckDuckGo, YouTube, GitHub, etc.
   - Optional filters (image search, videos, etc.)
   - Submit opens the selected search engine in a new tab with the query

3. **AI Chat Search Box**
   - Input box to type a question
   - Dropdown to select AI platform (ChatGPT, Gemini, Claude, etc.)
   - Submitting redirects to that chatbot’s URL and autofills the query (e.g., for ChatGPT: `https://chat.openai.com/?q=your+query`)

4. **Modular Sections (Each in Grid Layout)**
   - App Drawer: Custom web apps (e.g., Notion, Gmail)
   - Website Drawer: Sites you often visit
   - Visited Often: User-defined or static entries
   - Bookmarks
   - Each section:
     - Add Button (opens modal: name, URL, icon URL)
     - Items displayed in cards with icon + name
     - 3-dot menu per item (edit/delete)

5. **Create New Section**
   - Floating button: “+ Add New Section”
   - Modal input: Section name
   - Once created, user can add links like in other sections
   - Saved in `localStorage`

6. **Tab Group Launcher**
   - New section titled “Tab Groups”
   - Each item is a saved group of URLs with a name
   - Clicking a group opens all URLs in new tabs
   - Add/Edit/Delete Tab Group modals (input name + multiple URLs)

Storage:
- All data (apps, bookmarks, tab groups, etc.) stored in `localStorage`
- Icons loaded from user-provided URLs (fallback if broken)
- Optional default entries for demo

Animations:
- Fade-in for new items
- Smooth modal transitions

Responsiveness:
- Grid collapses on small screens
- Mobile-friendly layout

Output complete code for all files.
