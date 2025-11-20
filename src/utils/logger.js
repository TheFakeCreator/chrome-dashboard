// src/utils/logger.js
// Simple logger utility for Chrome Dashboard


const LOG_LEVELS = {
  info: { color: 'color: #2196f3', label: 'INFO' },
  warn: { color: 'color: #ff9800', label: 'WARN' },
  error: { color: 'color: #f44336', label: 'ERROR' },
  debug: { color: 'color: #9c27b0', label: 'DEBUG' }
};

// Generate a color for each module name
const MODULE_COLORS = {};
const MODULE_COLOR_PALETTE = [
  '#4caf50', '#e91e63', '#00bcd4', '#ffeb3b', '#3f51b5', '#ff5722', '#009688', '#cddc39', '#607d8b', '#795548', '#8bc34a', '#f44336', '#2196f3', '#9c27b0', '#ff9800'
];
let moduleColorIndex = 0;

function getModuleColor(module) {
  if (!MODULE_COLORS[module]) {
    MODULE_COLORS[module] = MODULE_COLOR_PALETTE[moduleColorIndex % MODULE_COLOR_PALETTE.length];
    moduleColorIndex++;
  }
  return `color: ${MODULE_COLORS[module]}; font-weight: bold`;
}

function formatMessage(module, level, ...args) {
  const { color, label } = LOG_LEVELS[level] || LOG_LEVELS.info;
  const prefix = `%c[${label}] [%c${module}%c]`;
  return [
    `${prefix}`,
    color,
    getModuleColor(module),
    'color: inherit',
    ...args
  ];
}

export const logger = {
  info(module, ...args) {
    console.log(...formatMessage(module, 'info', ...args));
  },
  warn(module, ...args) {
    console.warn(...formatMessage(module, 'warn', ...args));
  },
  error(module, ...args) {
    console.error(...formatMessage(module, 'error', ...args));
  },
  debug(module, ...args) {
    console.debug(...formatMessage(module, 'debug', ...args));
  }
};
