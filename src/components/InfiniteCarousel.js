/**
 * InfiniteCarousel Component
 * 
 * A performant infinite carousel with:
 * - True infinite scrolling (seamless loop)
 * - Touch/mouse drag support
 * - Keyboard navigation
 * - Auto-snap to items
 * - Configurable items per view
 * - Momentum-based animations
 * 
 * @example
 * const carousel = new InfiniteCarousel({
 *   itemsPerView: 4,
 *   gap: 16,
 *   autoSnap: true,
 *   onItemClick: (item, index) => console.log('Clicked:', item)
 * });
 * 
 * carousel.setItems([...items]);
 * document.body.appendChild(carousel.render());
 */

export class InfiniteCarousel {
  constructor(options = {}) {
    // Configuration
    this.itemsPerView = options.itemsPerView || 4;
    this.gap = options.gap || 16;
    this.autoSnap = options.autoSnap !== false;
    this.snapDuration = options.snapDuration || 300;
    this.dragThreshold = options.dragThreshold || 10;
    
    // Callbacks
    this.onItemClick = options.onItemClick || null;
    this.onItemRender = options.onItemRender || null;
    this.onActiveChange = options.onActiveChange || null;
    
    // State
    this.items = [];
    this.clonedItems = [];
    this.currentIndex = 0;
    this.translateX = 0;
    this.isDragging = false;
    this.startX = 0;
    this.currentX = 0;
    this.lastTranslateX = 0;
    this.velocity = 0;
    this.lastMoveTime = 0;
    this.rafId = null;
    this.wheelTimeout = null;
    
    // DOM elements
    this.container = null;
    this.track = null;
    this.itemElements = [];
    this.lastCenterItem = null;
    
    // Clone strategy: duplicate items on both sides for seamless infinite scroll
    this.cloneCount = this.itemsPerView + 2; // Extra clones for smooth transition
  }
  
  /**
   * Set items to display in carousel
   * @param {Array} items - Array of data items
   */
  setItems(items) {
    if (!Array.isArray(items) || items.length === 0) {
      this.items = [];
      this.clonedItems = [];
      return;
    }
    
    this.items = items;
    this.currentIndex = 0;
    
    // Create cloned array for infinite effect
    // Pattern: [...endClones, ...originalItems, ...startClones]
    this.clonedItems = [
      ...this.items.slice(-this.cloneCount), // Last N items cloned to start
      ...this.items,                          // Original items
      ...this.items.slice(0, this.cloneCount) // First N items cloned to end
    ];
    
    if (this.container) {
      this._renderItems();
      this._updatePosition(false);
    }
  }
  
  /**
   * Render the carousel container
   * @returns {HTMLElement} Carousel container element
   */
  render() {
    // Create container with Tailwind classes
    this.container = document.createElement('div');
    this.container.className = 'relative w-full min-h-[300px] h-[300px] select-none py-12 bg-gradient-to-b from-transparent via-dark-surface/30 to-transparent';
    this.container.setAttribute('tabindex', '0');
    
    // Add fade gradients on edges
    const fadeLeft = document.createElement('div');
    fadeLeft.className = 'absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-dark-bg to-transparent pointer-events-none z-10';
    this.container.appendChild(fadeLeft);
    
    const fadeRight = document.createElement('div');
    fadeRight.className = 'absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-dark-bg to-transparent pointer-events-none z-10';
    this.container.appendChild(fadeRight);
    
    // Create viewport wrapper for overflow control
    this.viewport = document.createElement('div');
    this.viewport.className = 'relative w-full h-full overflow-hidden overflow-x-hidden overflow-y-visible';
    
    // Create track (holds items)
    this.track = document.createElement('div');
    this.track.className = 'flex flex-row flex-nowrap items-center justify-start h-full min-h-[220px] cursor-grab transition-transform duration-[400ms] ease-out';
    this.track.style.width = 'max-content';
    this.track.style.willChange = 'transform'; // Optimize for GPU acceleration
    this.viewport.appendChild(this.track);
    this.container.appendChild(this.viewport);
    
    // Create navigation buttons
    const prevBtn = this._createNavButton('prev');
    const nextBtn = this._createNavButton('next');
    this.container.appendChild(prevBtn);
    this.container.appendChild(nextBtn);
    
    // Render items if they exist
    if (this.clonedItems.length > 0) {
      this._renderItems();
      // Wait for DOM to render, then set initial position
      setTimeout(() => {
        this._updatePosition(false);
      }, 0);
    }
    
    // Attach event listeners
    this._attachEventListeners();
    
    return this.container;
  }
  
  /**
   * Render all items into the track
   * @private
   */
  _renderItems() {
    if (!this.track) return;
    
    // Clear existing items
    this.track.innerHTML = '';
    this.itemElements = [];
    
    // Render cloned items
    this.clonedItems.forEach((item, index) => {
      let itemEl;
      
      // Use custom render function if provided
      if (this.onItemRender) {
        const content = this.onItemRender(item, this._getOriginalIndex(index));
        
        // If content is already an HTMLElement with carousel-item class, use it directly
        if (content instanceof HTMLElement && content.classList.contains('carousel-item')) {
          itemEl = content;
        } else {
          // Otherwise, create wrapper
          itemEl = document.createElement('div');
          itemEl.className = 'carousel-item';
          if (typeof content === 'string') {
            itemEl.innerHTML = content;
          } else if (content instanceof HTMLElement) {
            itemEl.appendChild(content);
          }
        }
      } else {
        // Default rendering
        itemEl = document.createElement('div');
        itemEl.className = 'carousel-item';
        itemEl.textContent = JSON.stringify(item);
      }
      
      // Apply spacing only (width is handled by Tailwind classes)
      itemEl.style.marginRight = index < this.clonedItems.length - 1 ? `${this.gap}px` : '0';
      
      // Add click handler
      itemEl.addEventListener('click', (e) => {
        if (!this.isDragging && this.onItemClick) {
          this.onItemClick(item, this._getOriginalIndex(index), e);
        }
      });
      
      this.track.appendChild(itemEl);
      this.itemElements.push(itemEl);
    });
  }
  
  /**
   * Create navigation button with Tailwind styling
   * @private
   */
  _createNavButton(direction) {
    const btn = document.createElement('button');
    const baseClasses = 'absolute top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full backdrop-blur-xl bg-dark-surface/80 border border-primary-500/30 text-primary-400 hover:bg-primary-500/20 hover:border-primary-400/50 hover:text-primary-300 active:scale-95 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-primary-500/20';
    const positionClass = direction === 'prev' ? 'left-4' : 'right-4';
    btn.className = `${baseClasses} ${positionClass}`;
    btn.setAttribute('aria-label', direction === 'prev' ? 'Previous' : 'Next');
    
    const icon = direction === 'prev' ? '‹' : '›';
    btn.innerHTML = `<span class="text-3xl font-light leading-none">${icon}</span>`;
    
    btn.addEventListener('click', () => {
      if (direction === 'prev') {
        this.prev();
      } else {
        this.next();
      }
    });
    
    return btn;
  }
  
  /**
   * Attach event listeners for drag/swipe
   * @private
   */
  _attachEventListeners() {
    if (!this.container || !this.track) return;
    
    // Mouse events
    this.track.addEventListener('mousedown', this._handleDragStart.bind(this));
    document.addEventListener('mousemove', this._handleDragMove.bind(this));
    document.addEventListener('mouseup', this._handleDragEnd.bind(this));
    
    // Touch events
    this.track.addEventListener('touchstart', this._handleDragStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this._handleDragMove.bind(this), { passive: false });
    document.addEventListener('touchend', this._handleDragEnd.bind(this));
    
    // Mouse wheel scrolling
    this.container.addEventListener('wheel', this._handleWheel.bind(this), { passive: false });
    
    // Keyboard navigation
    this.container.addEventListener('keydown', this._handleKeydown.bind(this));
    this.container.setAttribute('tabindex', '0');
    
    // Prevent text selection during drag
    this.track.addEventListener('selectstart', (e) => e.preventDefault());
  }
  
  /**
   * Handle mouse wheel scrolling
   * @private
   */
  _handleWheel(event) {
    event.preventDefault();
    
    // Scroll left/right with horizontal wheel or shift+wheel
    const delta = event.deltaX !== 0 ? event.deltaX : event.deltaY;
    
    // Throttle wheel events more aggressively to prevent lag
    if (this.wheelTimeout) return;
    
    this.wheelTimeout = setTimeout(() => {
      this.wheelTimeout = null;
    }, 150); // Increased throttle time
    
    // Only trigger on significant scroll
    if (Math.abs(delta) > 10) {
      if (delta > 0) {
        this.next();
      } else if (delta < 0) {
        this.prev();
      }
    }
  }
  
  /**
   * Handle drag/touch start
   * @private
   */
  _handleDragStart(event) {
    this.isDragging = true;
    this.startX = this._getEventX(event);
    this.currentX = this.startX;
    this.lastTranslateX = this.translateX;
    this.velocity = 0;
    this.lastMoveTime = Date.now();
    
    // Cancel any ongoing animation
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    
    this.container.classList.add('is-dragging');
    this.track.style.transition = 'none';
  }
  
  /**
   * Handle drag/touch move
   * @private
   */
  _handleDragMove(event) {
    if (!this.isDragging) return;
    
    event.preventDefault();
    
    const x = this._getEventX(event);
    const deltaX = x - this.currentX;
    const now = Date.now();
    const deltaTime = now - this.lastMoveTime;
    
    // Calculate velocity for momentum
    if (deltaTime > 0) {
      this.velocity = deltaX / deltaTime;
    }
    
    this.currentX = x;
    this.lastMoveTime = now;
    
    // Update position with GPU acceleration
    const dragDistance = x - this.startX;
    this.translateX = this.lastTranslateX + dragDistance;
    
    this.track.style.transform = `translate3d(${this.translateX}px, 0, 0)`;
  }
  
  /**
   * Handle drag/touch end
   * @private
   */
  _handleDragEnd(event) {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    this.container.classList.remove('is-dragging');
    
    const dragDistance = this.currentX - this.startX;
    
    // Determine if this was a swipe or just a click
    if (Math.abs(dragDistance) < this.dragThreshold) {
      // Just a click, snap back
      this._updatePosition(true);
      return;
    }
    
    // Apply momentum
    const momentumDistance = this.velocity * 200; // Momentum factor
    const totalDistance = dragDistance + momentumDistance;
    
    // Calculate how many items to move
    const itemWidth = this._getItemWidth() + this.gap;
    const itemsToMove = Math.round(-totalDistance / itemWidth);
    
    // Navigate
    this.currentIndex += itemsToMove;
    this._updatePosition(true);
  }
  
  /**
   * Handle keyboard navigation
   * @private
   */
  _handleKeydown(event) {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.prev();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.next();
        break;
      case 'Home':
        event.preventDefault();
        this.goTo(0);
        break;
      case 'End':
        event.preventDefault();
        this.goTo(this.items.length - 1);
        break;
    }
  }
  
  /**
   * Navigate to previous item
   */
  prev() {
    this.currentIndex--;
    this._updatePosition(true);
  }
  
  /**
   * Navigate to next item
   */
  next() {
    this.currentIndex++;
    this._updatePosition(true);
  }
  
  /**
   * Navigate to specific item index
   */
  goTo(index) {
    this.currentIndex = index;
    this._updatePosition(true);
  }
  
  /**
   * Update carousel position
   * @private
   * @param {boolean} animate - Whether to animate the transition
   */
  _updatePosition(animate = true) {
    if (!this.track || this.items.length === 0) return;
    
    const itemWidth = this._getItemWidth() + this.gap;
    const viewportWidth = this.viewport?.offsetWidth || this.container?.offsetWidth || 0;
    
    // Calculate position to center the current item
    // Center offset: move the track so the current item is in the middle of viewport
    const centerOffset = viewportWidth / 2 - itemWidth / 2;
    
    // Calculate position (accounting for clones at start)
    const offsetIndex = this.currentIndex + this.cloneCount;
    this.translateX = centerOffset - (offsetIndex * itemWidth);
    
    // Apply transition - use will-change for better performance
    if (animate) {
      this.track.style.willChange = 'transform';
      this.track.style.transition = `transform ${this.snapDuration}ms cubic-bezier(0.4, 0.0, 0.2, 1)`;
    } else {
      this.track.style.transition = 'none';
    }
    
    // Use transform for GPU acceleration
    this.track.style.transform = `translate3d(${this.translateX}px, 0, 0)`;
    
    // Update center item styling
    this._updateCenterItem();
    
    // Handle infinite loop wraparound
    if (animate) {
      setTimeout(() => {
        this.track.style.willChange = 'auto';
        this._checkLoopPosition();
      }, this.snapDuration);
    }
    
    // Notify active change
    if (this.onActiveChange) {
      this.onActiveChange(this._normalizeIndex(this.currentIndex));
    }
  }
  
  /**
   * Update center item styling
   * @private
   */
  _updateCenterItem() {
    if (!this.itemElements || this.itemElements.length === 0) return;
    
    const centerIndex = this.currentIndex + this.cloneCount;
    const newCenterItem = this.itemElements[centerIndex];
    
    // Only update if center item changed (avoid unnecessary DOM operations)
    if (this.lastCenterItem === newCenterItem) return;
    
    // Remove is-center from previous center item only
    if (this.lastCenterItem) {
      this.lastCenterItem.classList.remove('is-center');
    }
    
    // Add is-center to new center item
    if (newCenterItem) {
      newCenterItem.classList.add('is-center');
      this.lastCenterItem = newCenterItem;
    }
  }
  
  /**
   * Check if we need to jump to maintain infinite loop illusion
   * @private
   */
  _checkLoopPosition() {
    if (this.items.length === 0) return;
    
    const itemWidth = this._getItemWidth() + this.gap;
    const viewportWidth = this.viewport?.offsetWidth || this.container?.offsetWidth || 0;
    const centerOffset = viewportWidth / 2 - itemWidth / 2;
    
    let needsJump = false;
    let newIndex = this.currentIndex;
    
    // If we're past the end clones, jump back to original items
    if (this.currentIndex >= this.items.length) {
      newIndex = this.currentIndex % this.items.length;
      needsJump = true;
    }
    // If we're before the start clones, jump forward to original items
    else if (this.currentIndex < 0) {
      newIndex = this.items.length + (this.currentIndex % this.items.length);
      if (newIndex >= this.items.length) newIndex = newIndex % this.items.length;
      needsJump = true;
    }
    
    if (needsJump) {
      this.currentIndex = newIndex;
      
      // Instant jump (no animation) - with center offset, using GPU acceleration
      const offsetIndex = this.currentIndex + this.cloneCount;
      this.translateX = centerOffset - (offsetIndex * itemWidth);
      this.track.style.transition = 'none';
      this.track.style.transform = `translate3d(${this.translateX}px, 0, 0)`;
      
      // Update center item
      this._updateCenterItem();
      
      // Force reflow only once
      void this.track.offsetHeight;
    }
  }
  
  /**
   * Get item width - using fixed 180px from Tailwind classes
   * @private
   */
  _getItemWidth() {
    // Items are 180px wide (defined in Tailwind classes w-[180px])
    // Try to get actual width from rendered element, fallback to 180
    if (this.itemElements && this.itemElements.length > 0) {
      const firstItem = this.itemElements[0];
      if (firstItem) {
        return firstItem.offsetWidth || 180;
      }
    }
    return 180; // Fixed width from Tailwind
  }
  
  /**
   * Get X coordinate from mouse or touch event
   * @private
   */
  _getEventX(event) {
    return event.type.includes('touch') 
      ? event.touches[0]?.clientX || event.changedTouches[0]?.clientX || 0
      : event.clientX;
  }
  
  /**
   * Get original item index from cloned array index
   * @private
   */
  _getOriginalIndex(clonedIndex) {
    return this._normalizeIndex(clonedIndex - this.cloneCount);
  }
  
  /**
   * Normalize index to valid range
   * @private
   */
  _normalizeIndex(index) {
    if (this.items.length === 0) return 0;
    return ((index % this.items.length) + this.items.length) % this.items.length;
  }
  
  /**
   * Get current active index
   */
  getCurrentIndex() {
    return this._normalizeIndex(this.currentIndex);
  }
  
  /**
   * Update responsive configuration
   */
  updateItemsPerView(count) {
    this.itemsPerView = count;
    this.cloneCount = this.itemsPerView + 2;
    
    if (this.items.length > 0) {
      this.setItems(this.items);
    }
  }
  
  /**
   * Destroy carousel and clean up
   */
  destroy() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    
    if (this.wheelTimeout) {
      clearTimeout(this.wheelTimeout);
    }
    
    if (this.container) {
      this.container.remove();
    }
    
    this.items = [];
    this.clonedItems = [];
    this.itemElements = [];
    this.lastCenterItem = null;
  }
}
