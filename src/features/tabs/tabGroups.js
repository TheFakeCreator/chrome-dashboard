// Tab groups logic
export function getTabGroups() {
  const saved = localStorage.getItem('tabGroups');
  if (saved) return JSON.parse(saved);
  localStorage.setItem('tabGroups', JSON.stringify([]));
  return [];
}
export function saveTabGroups(groups) {
  localStorage.setItem('tabGroups', JSON.stringify(groups));
}
export function renderTabGroups() {
  const list = document.getElementById('tab-groups-list');
  list.innerHTML = '';
  const groups = getTabGroups();
  groups.forEach((group, idx) => {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
      <span class="card-name">${group.name}</span>
      <span class="card-menu" title="Options">&#x22EE;</span>
    `;
    div.addEventListener('click', function(e) {
      if (e.target.classList.contains('card-menu')) {
        openTabGroupMenu(idx);
      } else {
        group.urls.forEach(url => window.open(url, '_blank'));
      }
    });
    list.appendChild(div);
  });
}

function openTabGroupMenu(idx) {
  import('./modal.js').then(({ showModal, hideModal }) => {
    showModal(`
      <div style="display:flex;flex-direction:column;gap:8px;">
        <button id="edit-tab-group-btn">Edit</button>
        <button type="button">Delete</button>
      </div>
    `);
    setTimeout(() => {
      const editBtn = document.getElementById('edit-tab-group-btn');
      if (editBtn) {
        editBtn.addEventListener('click', () => openEditTabGroupModal(idx));
      }
      const deleteBtn = document.querySelector('button[type="button"]');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          const groups = getTabGroups();
          groups.splice(idx, 1);
          saveTabGroups(groups);
          renderTabGroups();
          hideModal();
        });
      }
    }, 0);
  });
}

function openEditTabGroupModal(idx) {
  import('./modal.js').then(({ showModal, hideModal }) => {
    const groups = getTabGroups();
    const group = groups[idx];
    showModal(`
      <h2>Edit Tab Group</h2>
      <form id="edit-tab-group-form">
        <input type="text" name="name" value="${group.name}" required><br><br>
        <textarea name="urls" style="width:100%;height:80px;">${group.urls.join('\n')}</textarea><br><br>
        <button type="submit">Save</button>
        <button type="button">Cancel</button>
      </form>
    `);
    setTimeout(() => {
      const editForm = document.getElementById('edit-tab-group-form');
      if (editForm) {
        editForm.addEventListener('submit', function(e) {
          e.preventDefault();
          group.name = this.name.value.trim();
          group.urls = this.urls.value.split(/\r?\n/).map(u => u.trim()).filter(u => u);
          saveTabGroups(groups);
          renderTabGroups();
          hideModal();
        });
      }
    }, 0);
  });
}
