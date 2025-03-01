/**
 * Generated Cursor Rules
 * Created with rules CLI
 */

// Selected rules: basic, hover

(function() {
  'use strict';

  // Basic cursor setup
  function setupBasicCursor() {
    const customCursor = document.createElement('div');
    customCursor.classList.add('custom-cursor');
    document.body.appendChild(customCursor);

    document.addEventListener('mousemove', (e) => {
      customCursor.style.left = `${e.clientX}px`;
      customCursor.style.top = `${e.clientY}px`;
    });

    // Add the necessary CSS
    const style = document.createElement('style');
    style.textContent = `
      .custom-cursor {
        position: fixed;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: rgba(75, 75, 75, 0.5);
        border: 1px solid white;
        pointer-events: none;
        transform: translate(-50%, -50%);
        z-index: 9999;
        transition: width 0.3s, height 0.3s;
      }
      body {
        cursor: none;
      }
    `;
    document.head.appendChild(style);
  }

  // Hover effects for cursor
  function setupHoverEffects() {
    const style = document.createElement('style');
    style.textContent = `
      .hover-effect {
        cursor: none !important;
      }
      .custom-cursor.hover {
        width: 30px;
        height: 30px;
        background-color: rgba(100, 100, 255, 0.5);
        mix-blend-mode: difference;
      }
    `;
    document.head.appendChild(style);

    // Add hover-effect class to all clickable elements
    const clickableElements = document.querySelectorAll('a, button, input, select, textarea, [role="button"]');
    clickableElements.forEach(el => {
      el.classList.add('hover-effect');
      
      el.addEventListener('mouseenter', () => {
        document.querySelector('.custom-cursor').classList.add('hover');
      });
      
      el.addEventListener('mouseleave', () => {
        document.querySelector('.custom-cursor').classList.remove('hover');
      });
    });
  }

  // Initialize cursor rules
  function initCursorRules() {
    setupBasicCursor();
    setupHoverEffects();
  }

  // Run initialization when DOM is fully loaded
  document.addEventListener('DOMContentLoaded', initCursorRules);

})();