/**
 * @module Icons
 * @description Icon utility using Lucide icons
 * 
 * @example
 * import { initIcons } from '@utils/icons.js';
 * initIcons(); // Call after DOM is ready
 */

import * as icons from 'lucide-static';

/**
 * Get icon SVG from lucide-static
 * @param {string} name - Icon name (e.g., 'settings', 'sun', 'moon')
 * @param {Object} options - Icon options
 * @returns {string} SVG string
 */
function getIconSvg(name, options = {}) {
  const {
    size = 24,
    color = 'currentColor',
    strokeWidth = 2,
    class: className = '',
  } = options;

  // Convert kebab-case to PascalCase for icon lookup
  const iconName = name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  
  const iconSvg = icons[iconName];
  
  if (!iconSvg) {
    console.warn(`Icon "${name}" not found in lucide-static`);
    return '';
  }

  // Replace default attributes
  return iconSvg
    .replace(/width="\d+"/, `width="${size}"`)
    .replace(/height="\d+"/, `height="${size}"`)
    .replace(/stroke="[^"]*"/, `stroke="${color}"`)
    .replace(/stroke-width="[^"]*"/, `stroke-width="${strokeWidth}"`)
    .replace(/<svg/, `<svg class="${className}"`);
}

/**
 * Initialize all icons in the DOM
 * Call this after adding new icons to the page
 */
export function initIcons() {
  // Find all elements with data-lucide attribute
  const iconElements = document.querySelectorAll('[data-lucide]');
  
  iconElements.forEach(element => {
    const iconName = element.getAttribute('data-lucide');
    const size = element.getAttribute('data-lucide-size') || element.classList.contains('w-5') ? 20 : 24;
    const color = element.getAttribute('data-lucide-color') || 'currentColor';
    const strokeWidth = element.getAttribute('data-lucide-stroke-width') || 2;
    const className = element.className;

    const svg = getIconSvg(iconName, { size, color, strokeWidth, class: className });
    
    if (svg) {
      element.outerHTML = svg;
    }
  });
}

/**
 * Get icon SVG string
 * @param {string} name - Icon name
 * @param {Object} options - Icon options
 * @returns {string} SVG string
 */
export function getIconSVG(name, options = {}) {
  const {
    size = 20,
    color = 'currentColor',
    strokeWidth = 2,
    class: className = '',
  } = options;

  const icon = icons[name];
  if (!icon) {
    console.warn(`Icon "${name}" not found`);
    return '';
  }

  return `<i data-lucide="${name}" class="${className}"></i>`;
}

/**
 * Common icon presets
 */
export const IconPresets = {
  small: { size: 16, strokeWidth: 2 },
  medium: { size: 20, strokeWidth: 2 },
  large: { size: 24, strokeWidth: 2 },
  xl: { size: 32, strokeWidth: 2 },
};

/**
 * Icon names mapping for easy reference
 */
export const IconNames = {
  // Navigation
  Settings: 'settings',
  Home: 'home',
  Search: 'search',
  Menu: 'menu',
  X: 'x',
  ChevronDown: 'chevron-down',
  ChevronUp: 'chevron-up',
  ChevronLeft: 'chevron-left',
  ChevronRight: 'chevron-right',

  // Actions
  Plus: 'plus',
  Minus: 'minus',
  Edit: 'pencil',
  Trash: 'trash-2',
  Save: 'save',
  Check: 'check',
  Copy: 'copy',
  ExternalLink: 'external-link',
  Download: 'download',
  Upload: 'upload',

  // Weather
  Sun: 'sun',
  Moon: 'moon',
  Cloud: 'cloud',
  CloudRain: 'cloud-rain',
  CloudSnow: 'cloud-snow',
  Wind: 'wind',

  // Time
  Clock: 'clock',
  Calendar: 'calendar',
  Timer: 'timer',

  // Widgets
  Widget: 'layout-grid',
  Bookmark: 'bookmark',
  Link: 'link',
  Image: 'image',
  
  // Status
  Info: 'info',
  AlertCircle: 'alert-circle',
  CheckCircle: 'check-circle',
  XCircle: 'x-circle',
  
  // Theme
  Palette: 'palette',
  Eye: 'eye',
  EyeOff: 'eye-off',
  
  // Misc
  RefreshCw: 'refresh-cw',
  Maximize: 'maximize',
  Minimize: 'minimize',
  Grid: 'grid',
  List: 'list',
};
