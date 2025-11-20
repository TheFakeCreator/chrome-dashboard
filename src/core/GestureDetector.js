import { logger as log } from "../utils/logger";
const module = 'GestureDetector';
/**
 * GestureDetector - Detects trackpad and touch gestures
 * Supports two-finger swipe for panel navigation
 */

export class GestureDetector {
  /**
   * Create gesture detector
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.threshold = options.threshold || 50; // Minimum distance for swipe detection
    this.velocity = options.velocity || 0.3; // Minimum velocity for swipe
    this.cooldown = options.cooldown || 500; // Cooldown period between gestures (ms)
    this.element = null;
    
    // Tracking state
    this.startX = 0;
    this.startY = 0;
    this.currentX = 0;
    this.currentY = 0;
    this.startTime = 0;
    this.isTracking = false;
    this.hasTriggered = false; // Flag to ensure one trigger per gesture
    this.lastTriggerTime = 0; // Track last gesture trigger time

    // Callbacks
    this.onSwipeUp = options.onSwipeUp || null;
    this.onSwipeDown = options.onSwipeDown || null;
    this.onSwipeLeft = options.onSwipeLeft || null;
    this.onSwipeRight = options.onSwipeRight || null;

    // Bound handlers
    this._wheelHandler = this._handleWheel.bind(this);
    this._touchStartHandler = this._handleTouchStart.bind(this);
    this._touchMoveHandler = this._handleTouchMove.bind(this);
    this._touchEndHandler = this._handleTouchEnd.bind(this);

    log.info(module, 'Initialized with threshold:', this.threshold);
  }

  /**
   * Initialize gesture detection on element
   * @param {HTMLElement} element - Element to attach listeners to
   */
  initialize(element) {
    if (!element) {
      log.error(module, 'Element not provided');
      return false;
    }

    this.element = element;
    this._attachListeners();

    log.info(module, 'Gesture detection active');
    return true;
  }

  /**
   * Attach event listeners
   * @private
   */
  _attachListeners() {
    // Trackpad/mouse wheel events
    this.element.addEventListener('wheel', this._wheelHandler, { passive: false });

    // Touch events for mobile/tablet support
    this.element.addEventListener('touchstart', this._touchStartHandler, { passive: true });
    this.element.addEventListener('touchmove', this._touchMoveHandler, { passive: false });
    this.element.addEventListener('touchend', this._touchEndHandler, { passive: true });
  }

  /**
   * Handle wheel events (trackpad gestures)
   * @private
   * @param {WheelEvent} event - Wheel event
   */
  _handleWheel(event) {
    // Detect two-finger trackpad swipe
    // ctrlKey is set for pinch-to-zoom, we want regular two-finger swipe
    if (event.ctrlKey) return;

    const deltaX = event.deltaX;
    const deltaY = event.deltaY;

    // Ignore small movements (noise)
    if (Math.abs(deltaX) < 5 && Math.abs(deltaY) < 5) return;

    // Start tracking if not already
    if (!this.isTracking) {
      this.startX = 0;
      this.startY = 0;
      this.startTime = Date.now();
      this.isTracking = true;
      this.hasTriggered = false; // Flag to ensure only one trigger per gesture
      log.info(module, 'Starting new gesture');
    }

    // If already triggered in this gesture, ignore further deltas
    if (this.hasTriggered) {
      // Silently ignore - this is normal behavior during a single gesture
      return;
    }

    this.currentX += deltaX;
    this.currentY += deltaY;

    // Check if threshold reached
    const absX = Math.abs(this.currentX);
    const absY = Math.abs(this.currentY);

    if (absX > this.threshold || absY > this.threshold) {
      // Determine primary direction
      if (absY > absX) {
        // Vertical swipe
        if (this.currentY > 0) {
          this._triggerSwipe('down', event);
        } else {
          this._triggerSwipe('up', event);
        }
      } else {
        // Horizontal swipe
        if (this.currentX > 0) {
          this._triggerSwipe('right', event);
        } else {
          this._triggerSwipe('left', event);
        }
      }

      // Mark as triggered - ignore further deltas in this gesture
      this.hasTriggered = true;
    }

    // Auto-reset after gesture ends (no more wheel events)
    clearTimeout(this._resetTimer);
    this._resetTimer = setTimeout(() => {
      if (this.isTracking) {
        log.info(module, 'Gesture complete, resetting');
      }
      this._resetTracking();
    }, 500); // Wait 500ms after last wheel event to consider gesture complete
  }

  /**
   * Handle touch start
   * @private
   * @param {TouchEvent} event - Touch event
   */
  _handleTouchStart(event) {
    // Only handle single touch for now
    if (event.touches.length !== 1) return;

    const touch = event.touches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.currentX = touch.clientX;
    this.currentY = touch.clientY;
    this.startTime = Date.now();
    this.isTracking = true;
  }

  /**
   * Handle touch move
   * @private
   * @param {TouchEvent} event - Touch event
   */
  _handleTouchMove(event) {
    if (!this.isTracking || event.touches.length !== 1) return;

    const touch = event.touches[0];
    this.currentX = touch.clientX;
    this.currentY = touch.clientY;
  }

  /**
   * Handle touch end
   * @private
   * @param {TouchEvent} event - Touch event
   */
  _handleTouchEnd(event) {
    if (!this.isTracking) return;

    const deltaX = this.currentX - this.startX;
    const deltaY = this.currentY - this.startY;
    const deltaTime = Date.now() - this.startTime;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Calculate velocity (pixels per ms)
    const velocityX = absX / deltaTime;
    const velocityY = absY / deltaTime;

    // Check if swipe meets threshold and velocity requirements
    if ((absX > this.threshold || absY > this.threshold) && 
        (velocityX > this.velocity || velocityY > this.velocity)) {
      
      // Determine primary direction
      if (absY > absX) {
        // Vertical swipe
        if (deltaY > 0) {
          this._triggerSwipe('down', event);
        } else {
          this._triggerSwipe('up', event);
        }
      } else {
        // Horizontal swipe
        if (deltaX > 0) {
          this._triggerSwipe('right', event);
        } else {
          this._triggerSwipe('left', event);
        }
      }
    }

    this._resetTracking();
  }

  /**
   * Trigger swipe callback
   * @private
   * @param {string} direction - Swipe direction
   * @param {Event} event - Original event
   */
  _triggerSwipe(direction, event) {
    log.info(module, 'Swipe detected:', direction);

    // Prevent default scrolling
    if (event.preventDefault) {
      event.preventDefault();
    }

    // Call appropriate callback
    switch (direction) {
      case 'up':
        if (this.onSwipeUp) this.onSwipeUp(event);
        break;
      case 'down':
        if (this.onSwipeDown) this.onSwipeDown(event);
        break;
      case 'left':
        if (this.onSwipeLeft) this.onSwipeLeft(event);
        break;
      case 'right':
        if (this.onSwipeRight) this.onSwipeRight(event);
        break;
    }
  }

  /**
   * Reset tracking state
   * @private
   */
  _resetTracking() {
    this.startX = 0;
    this.startY = 0;
    this.currentX = 0;
    this.currentY = 0;
    this.startTime = 0;
    this.isTracking = false;
    this.hasTriggered = false;
  }

  /**
   * Remove event listeners
   * @private
   */
  _detachListeners() {
    if (this.element) {
      this.element.removeEventListener('wheel', this._wheelHandler);
      this.element.removeEventListener('touchstart', this._touchStartHandler);
      this.element.removeEventListener('touchmove', this._touchMoveHandler);
      this.element.removeEventListener('touchend', this._touchEndHandler);
    }
  }

  /**
   * Destroy gesture detector
   */
  destroy() {
    this._detachListeners();
    this._resetTracking();
    
    if (this._resetTimer) {
      clearTimeout(this._resetTimer);
    }

    this.element = null;
    log.info(module, '[GestureDetector] Destroyed');
  }
}
