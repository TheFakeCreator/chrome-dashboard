// Sections logic
export const defaultSections = [
  { key: 'apps', name: 'App Drawer', items: [
    { name: 'Gmail', url: 'https://mail.google.com', icon: 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico' },
    { name: 'Notion', url: 'https://notion.so', icon: 'https://www.notion.so/images/favicon.ico' }
  ] },
  { key: 'websites', name: 'Website Drawer', items: [
    { name: 'YouTube', url: 'https://youtube.com', icon: 'https://www.youtube.com/s/desktop/fe2e3e3e/img/favicon.ico' },
    { name: 'Reddit', url: 'https://reddit.com', icon: 'https://www.redditstatic.com/desktop2x/img/favicon/favicon.ico' }
  ] },
  { key: 'visited', name: 'Visited Often', items: [
    { name: 'VS Code', url: 'https://vscode.dev', icon: 'https://code.visualstudio.com/favicon.ico' }
  ] },
  { key: 'bookmarks', name: 'Bookmarks', items: [] }
];

export function getSections() {
  const saved = localStorage.getItem('sections');
  if (saved) return JSON.parse(saved);
  localStorage.setItem('sections', JSON.stringify(defaultSections));
  return JSON.parse(JSON.stringify(defaultSections));
}
export function saveSections(sections) {
  localStorage.setItem('sections', JSON.stringify(sections));
}
export function renderSections() {
  const grid = document.getElementById('grid-sections');
  grid.innerHTML = '';
  const sections = getSections();
  sections.forEach((section, idx) => {
    const secDiv = document.createElement('div');
    secDiv.className = 'section';
    secDiv.setAttribute('data-key', section.key);
    secDiv.innerHTML = `
      <div class="section-header">
        <span class="section-title">${section.name}</span>
        <span class="section-menu" title="Section Options">&#x22EE;</span>
      </div>
      <div class="cards"></div>
    `;
    secDiv.querySelector('.section-menu').addEventListener('click', (e) => openSectionMenu(e, idx));
    const cardsDiv = secDiv.querySelector('.cards');
    section.items.forEach((item, itemIdx) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <img class="card-icon" src="${item.icon}" alt="icon">
        <a class="card-name" href="${item.url}" target="_blank">${item.name}</a>
        <span class="card-menu" title="Options">&#x22EE;</span>
      `;
      const img = card.querySelector('.card-icon');
      img.addEventListener('error', () => {
        img.src = `https://www.google.com/s2/favicons?domain=${item.url}`;
      });
      card.querySelector('.card-menu').addEventListener('click', (e) => openCardMenu(e, idx, itemIdx));
      cardsDiv.appendChild(card);
    });
    const addCard = document.createElement('div');
    addCard.className = 'card';
    addCard.style.padding = '0';
    addCard.style.aspectRatio = '1/1';
    addCard.style.width = '52px';
    addCard.style.height = '52px';
    addCard.innerHTML = `
      <button class="section-add-btn" title="Add Item" style="width:100%;height:100%;font-size:2.2em;display:flex;align-items:center;justify-content:center;border:none;background:none;color:inherit;cursor:pointer;">+</button>
    `;
    addCard.querySelector('button').addEventListener('click', () => openAddItemModal(idx));
    cardsDiv.appendChild(addCard);
    grid.appendChild(secDiv);
  });
}

function openSectionMenu(e, sectionIdx) {
  import('./modal.js').then(({ showModal, hideModal }) => {
    showModal(`
      <div style="display:flex;flex-direction:column;gap:8px;">
        <button type="button" id="delete-section-btn">Delete Section</button>
      </div>
    `);
    setTimeout(() => {
      const deleteBtn = document.getElementById('delete-section-btn');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          const sections = getSections();
          sections.splice(sectionIdx, 1);
          saveSections(sections);
          renderSections();
          hideModal();
        });
      }
    }, 0);
  });
}

function openAddItemModal(sectionIdx) {
  import('./modal.js').then(({ showModal, hideModal }) => {
    showModal(`
      <h2>Add Item</h2>
      <form id="add-item-form">
        <input type="text" name="name" placeholder="Name" required><br><br>
        <input type="url" name="url" placeholder="URL" required><br><br>
        <input type="url" name="icon" placeholder="Icon URL (optional)"><br><br>
        <button type="submit">Add</button>
        <button type="button">Cancel</button>
      </form>
    `);
    setTimeout(() => {
      const addForm = document.getElementById('add-item-form');
      if (addForm) {
        addForm.addEventListener('submit', function(e) {
          e.preventDefault();
          const name = this.name.value.trim();
          const url = this.url.value.trim();
          const icon = this.icon.value.trim() || `https://www.google.com/s2/favicons?domain=${url}`;
          if (!name || !url) return;
          const sections = getSections();
          sections[sectionIdx].items.push({ name, url, icon });
          saveSections(sections);
          renderSections();
          hideModal();
        });
      }
    }, 0);
  });
}

function openCardMenu(e, sectionIdx, itemIdx) {
  // Remove any existing popup menu
  const oldPopup = document.getElementById('card-popup-menu');
  if (oldPopup) oldPopup.remove();
  const popup = document.createElement('div');
  popup.id = 'card-popup-menu';
  popup.style.position = 'fixed';
  const rect = e.target.getBoundingClientRect();
  popup.style.left = `${rect.left}px`;
  popup.style.top = `${rect.bottom + 6}px`;
  popup.style.zIndex = '1002';
  popup.style.background = '#23262f';
  popup.style.borderRadius = '8px';
  popup.style.boxShadow = '0 2px 12px rgba(0,0,0,0.18)';
  popup.style.minWidth = '120px';
  popup.style.display = 'flex';
  popup.style.flexDirection = 'column';
  popup.style.gap = '8px';
  popup.style.padding = '8px 0';
  popup.innerHTML = `
    <button id="edit-item-btn" class="card-popup-btn">Edit</button>
    <button type="button" class="card-popup-btn">Delete</button>
  `;
  document.body.appendChild(popup);
  setTimeout(() => {
    const editBtn = popup.querySelector('#edit-item-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        openEditItemModal(sectionIdx, itemIdx);
        popup.remove();
      });
    }
    const deleteBtn = popup.querySelector('button[type="button"]');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        const sections = getSections();
        sections[sectionIdx].items.splice(itemIdx, 1);
        saveSections(sections);
        renderSections();
        popup.remove();
      });
    }
  }, 0);
  function handleClickOutside(ev) {
    if (!popup.contains(ev.target)) {
      popup.remove();
      document.removeEventListener('mousedown', handleClickOutside);
    }
  }
  document.addEventListener('mousedown', handleClickOutside);
}

function openEditItemModal(sectionIdx, itemIdx) {
  import('./modal.js').then(({ showModal, hideModal }) => {
    const sections = getSections();
    const item = sections[sectionIdx].items[itemIdx];
    showModal(`
      <h2>Edit Item</h2>
      <form id="edit-item-form">
        <input type="text" name="name" value="${item.name}" required><br><br>
        <input type="url" name="url" value="${item.url}" required><br><br>
        <input type="url" name="icon" value="${item.icon}"><br><br>
        <button type="submit">Save</button>
        <button type="button">Cancel</button>
      </form>
    `);
    setTimeout(() => {
      const editForm = document.getElementById('edit-item-form');
      if (editForm) {
        editForm.addEventListener('submit', function(e) {
          e.preventDefault();
          item.name = this.name.value.trim();
          item.url = this.url.value.trim();
          item.icon = this.icon.value.trim() || `https://www.google.com/s2/favicons?domain=${item.url}`;
          saveSections(sections);
          renderSections();
          hideModal();
        });
      }
    }, 0);
  });
}
