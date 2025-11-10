/**
 * ExtensionCard Component
 * 
 * Individual extension card with toggle switch, icon, and quick actions.
 * Mobile-style UI inspired by Android/iOS control centers.
 */

import { BaseComponent } from '../components/BaseComponent.js';
import * as icons from 'lucide-static';

export class ExtensionCard extends BaseComponent {
  constructor(extension, options = {}) {
    super(options.app, { autoMount: false, autoRender: false });
    
    this.extension = extension;
    this.onToggle = options.onToggle || null;
    this.onOptions = options.onOptions || null;
    this.onUninstall = options.onUninstall || null;
  }

  /**
   * Render the extension card (Mobile Tile Style)
   * @returns {HTMLElement}
   */
  render() {
    this.element = document.createElement('div');
    const isEnabled = this.extension.enabled;
    
    // Mobile-style tile that's clickable
    this.element.className = `extension-tile cursor-pointer relative p-4 rounded-2xl transition-all duration-300 ${
      isEnabled 
        ? 'bg-primary-500/20 border-2 border-primary-500/50 hover:bg-primary-500/30' 
        : 'bg-dark-surface/40 border-2 border-dark-border/30 hover:bg-dark-surface/60'
    }`;
    this.element.dataset.extensionId = this.extension.id;

    const iconUrl = this._getExtensionIcon();

    this.element.innerHTML = `
      <!-- Extension Icon (Centered) -->
      <div class="flex flex-col items-center justify-center text-center gap-3">
        <div class="w-16 h-16 rounded-xl overflow-hidden bg-dark-card/30 flex items-center justify-center transition-all ${isEnabled ? 'scale-100' : 'scale-90 opacity-50 grayscale'}">
          <img 
            src="${iconUrl}" 
            alt="${this.extension.name}"
            class="w-full h-full object-contain"
            onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22><rect width=%2264%22 height=%2264%22 fill=%22%234f46e5%22/><text x=%2232%22 y=%2240%22 font-size=%2228%22 text-anchor=%22middle%22 fill=%22white%22>${this.extension.name.charAt(0).toUpperCase()}</text></svg>'"
          />
        </div>

        <!-- Extension Name -->
        <div class="w-full">
          <h3 class="text-sm font-medium truncate transition-colors ${
            isEnabled ? 'text-dark-text' : 'text-dark-muted'
          }">
            ${this.extension.name}
          </h3>
          <p class="text-xs mt-0.5 ${
            isEnabled ? 'text-primary-400 font-medium' : 'text-dark-muted'
          }">
            ${isEnabled ? 'ON' : 'OFF'}
          </p>
        </div>
      </div>
    `;

    this._attachEventListeners();
    return this.element;
  }

  /**
   * Update the card state
   * @param {Object} extension - Updated extension info
   */
  update(extension) {
    this.extension = extension;
    
    const iconEl = this.element.querySelector('img');
    const nameEl = this.element.querySelector('h3');
    const versionEl = this.element.querySelector('p');
    const toggle = this.element.querySelector('.extension-toggle');
    const toggleSpan = toggle.querySelector('span');
    const iconContainer = this.element.querySelector('div:first-child');

    const isEnabled = extension.enabled;

    // Update icon opacity
    if (iconContainer) {
      if (isEnabled) {
        iconContainer.classList.remove('opacity-50', 'grayscale');
      } else {
        iconContainer.classList.add('opacity-50', 'grayscale');
      }
    }

    // Update name opacity
    if (nameEl) {
      if (isEnabled) {
        nameEl.classList.remove('text-dark-muted');
        nameEl.classList.add('text-dark-text');
      } else {
        nameEl.classList.remove('text-dark-text');
        nameEl.classList.add('text-dark-muted');
      }
    }

    // Update toggle state
    if (toggle) {
      if (isEnabled) {
        toggle.classList.remove('bg-dark-border');
        toggle.classList.add('bg-primary-500');
      } else {
        toggle.classList.remove('bg-primary-500');
        toggle.classList.add('bg-dark-border');
      }
    }

    // Update toggle position
    if (toggleSpan) {
      if (isEnabled) {
        toggleSpan.classList.remove('translate-x-1');
        toggleSpan.classList.add('translate-x-6');
      } else {
        toggleSpan.classList.remove('translate-x-6');
        toggleSpan.classList.add('translate-x-1');
      }
    }
  }

  /**
   * Attach event listeners
   * @private
   */
  _attachEventListeners() {
    // Make entire tile clickable to toggle extension
    this.element.addEventListener('click', () => {
      if (this.onToggle) {
        this.onToggle(this.extension.id, this.extension);
      }
    });
  }

  /**
   * Get extension icon URL
   * @private
   * @returns {string}
   */
  _getExtensionIcon() {
    if (!this.extension.icons || this.extension.icons.length === 0) {
      // Return placeholder SVG
      return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="%234f46e5"/><text x="20" y="25" font-size="20" text-anchor="middle" fill="white">${this.extension.name.charAt(0).toUpperCase()}</text></svg>`;
    }

    // Get the largest icon (prefer 128, then 48, then 16)
    const sizes = [128, 48, 32, 16];
    for (const size of sizes) {
      const icon = this.extension.icons.find(i => i.size === size);
      if (icon) {
        return icon.url;
      }
    }

    // Fallback to first available icon
    return this.extension.icons[0].url;
  }

  /**
   * Get version text
   * @private
   * @returns {string}
   */
  _getVersionText() {
    const parts = [];
    
    if (this.extension.version) {
      parts.push(`v${this.extension.version}`);
    }
    
    if (!this.extension.enabled) {
      parts.push('Disabled');
    }

    return parts.length > 0 ? parts.join(' • ') : 'Extension';
  }

  /**
   * Destroy the card
   */
  destroy() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}
