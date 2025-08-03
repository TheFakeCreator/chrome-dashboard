// Modal logic
export function showModal(html) {
  const modal = document.getElementById('modal');
  const modalOverlay = document.getElementById('modal-overlay');
  modal.innerHTML = html;
  modal.classList.remove('hidden');
  modalOverlay.classList.remove('hidden');
  setTimeout(() => {
    const cancelBtns = modal.querySelectorAll('button[type="button"]');
    cancelBtns.forEach(btn => {
      btn.addEventListener('click', hideModal);
    });
  }, 0);
}

export function hideModal() {
  const modal = document.getElementById('modal');
  const modalOverlay = document.getElementById('modal-overlay');
  modal.classList.add('hidden');
  modalOverlay.classList.add('hidden');
}
