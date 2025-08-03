// Custom Dropdown Component
// Usage: Replace <select> with <div class="custom-dropdown" data-name="search-engine">...</div>

class CustomDropdown {
  constructor(dropdown) {
    this.dropdown = dropdown;
    this.button = dropdown.querySelector('.dropdown-selected');
    this.optionsList = dropdown.querySelector('.dropdown-options');
    this.options = Array.from(dropdown.querySelectorAll('.dropdown-option'));
    this.input = dropdown.querySelector('input[type="hidden"]');
    this.setup();
  }

  setup() {
    this.button.addEventListener('click', () => {
      this.optionsList.classList.toggle('open');
    });
    this.options.forEach(option => {
      option.addEventListener('click', () => {
        this.selectOption(option);
        this.optionsList.classList.remove('open');
      });
    });
    document.addEventListener('click', (e) => {
      if (!this.dropdown.contains(e.target)) {
        this.optionsList.classList.remove('open');
      }
    });
  }

  selectOption(option) {
    this.button.textContent = option.textContent;
    this.input.value = option.getAttribute('data-value');
    this.options.forEach(opt => opt.classList.remove('selected'));
    option.classList.add('selected');
  }
}

// Initialize all custom dropdowns on page load
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
    new CustomDropdown(dropdown);
  });
});
