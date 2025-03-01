/**
 * Cursor rule templates
 * These templates provide the actual implementation code for each cursor rule type
 */

// Basic cursor rule template
const basic = `  // Basic cursor setup
  function setupBasicCursor() {
    const customCursor = document.createElement('div');
    customCursor.classList.add('custom-cursor');
    document.body.appendChild(customCursor);

    document.addEventListener('mousemove', (e) => {
      customCursor.style.left = \`\${e.clientX}px\`;
      customCursor.style.top = \`\${e.clientY}px\`;
    });

    // Add the necessary CSS
    const style = document.createElement('style');
    style.textContent = \`
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
    \`;
    document.head.appendChild(style);
  }`;

// Hover effects cursor rule template
const hover = `  // Hover effects for cursor
  function setupHoverEffects() {
    const style = document.createElement('style');
    style.textContent = \`
      .hover-effect {
        cursor: none !important;
      }
      .custom-cursor.hover {
        width: 30px;
        height: 30px;
        background-color: rgba(100, 100, 255, 0.5);
        mix-blend-mode: difference;
      }
    \`;
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
  }`;

// Click animation cursor rule template
const click = `  // Click animation for cursor
  function setupClickAnimation() {
    const clickRipple = document.createElement('div');
    clickRipple.classList.add('click-ripple');
    document.body.appendChild(clickRipple);

    // Add the necessary CSS
    const style = document.createElement('style');
    style.textContent = \`
      .click-ripple {
        position: fixed;
        width: 0;
        height: 0;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.4);
        pointer-events: none;
        z-index: 9998;
        opacity: 0;
        transform: translate(-50%, -50%);
      }
      
      .click-ripple.active {
        animation: ripple-effect 0.6s ease-out;
      }
      
      @keyframes ripple-effect {
        0% {
          width: 0;
          height: 0;
          opacity: 0.5;
        }
        100% {
          width: 100px;
          height: 100px;
          opacity: 0;
        }
      }
    \`;
    document.head.appendChild(style);

    // Add click event to trigger the animation
    document.addEventListener('mousedown', (e) => {
      const customCursor = document.querySelector('.custom-cursor');
      if (customCursor) {
        customCursor.style.transform = 'translate(-50%, -50%) scale(0.8)';
      }
      
      clickRipple.style.left = \`\${e.clientX}px\`;
      clickRipple.style.top = \`\${e.clientY}px\`;
      clickRipple.classList.remove('active');
      
      // Force a reflow
      void clickRipple.offsetWidth;
      
      clickRipple.classList.add('active');
    });

    document.addEventListener('mouseup', () => {
      const customCursor = document.querySelector('.custom-cursor');
      if (customCursor) {
        customCursor.style.transform = 'translate(-50%, -50%) scale(1)';
      }
    });
  }`;

// Custom cursor image rule template
const custom = `  // Custom cursor image setup
  function setupCustomCursor() {
    // Create style element for CSS
    const style = document.createElement('style');
    style.textContent = \`
      .custom-cursor.image-cursor {
        width: 32px;
        height: 32px;
        background-color: transparent;
        border: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 11l-8-8-8 8'/%3E%3Cpath d='M21 19l-8-8-8 8'/%3E%3C/svg%3E");
        background-size: contain;
        background-position: center;
        background-repeat: no-repeat;
      }
      
      .custom-cursor.image-cursor.hover {
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpath d='M12 8v8'/%3E%3Cpath d='M8 12h8'/%3E%3C/svg%3E");
      }
      
      .custom-cursor.image-cursor.active {
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpath d='M8 12h8'/%3E%3C/svg%3E");
      }
    \`;
    document.head.appendChild(style);

    // Apply image cursor class
    const customCursor = document.querySelector('.custom-cursor');
    if (customCursor) {
      customCursor.classList.add('image-cursor');
    }

    // Add mouse down/up events for active state
    document.addEventListener('mousedown', () => {
      customCursor.classList.add('active');
    });

    document.addEventListener('mouseup', () => {
      customCursor.classList.remove('active');
    });
  }`;

// Interactive cursor rule template
const interactive = `  // Interactive cursor with magnet effect
  function setupInteractiveCursor() {
    const magneticElements = document.querySelectorAll('a, button, .magnetic');
    const customCursor = document.querySelector('.custom-cursor');
    
    // Add styles for magnetic effect
    const style = document.createElement('style');
    style.textContent = \`
      .magnetic-area {
        display: inline-block;
        position: relative;
      }
      
      .custom-cursor.magnetic {
        transition: transform 0.3s ease-out, width 0.2s, height 0.2s;
        mix-blend-mode: difference;
      }
    \`;
    document.head.appendChild(style);
    
    // Add magnetic effect to elements
    magneticElements.forEach(el => {
      el.classList.add('magnetic-area');
      
      el.addEventListener('mousemove', (e) => {
        if (!customCursor) return;
        
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Calculate distance from mouse to center of element
        const distanceX = e.clientX - centerX;
        const distanceY = e.clientY - centerY;
        
        // The closer to the center, the stronger the magnetic effect
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
        const maxDistance = Math.min(rect.width, rect.height) * 1.5;
        const strength = 1 - Math.min(distance / maxDistance, 1);
        
        if (strength > 0) {
          // Apply magnetic effect based on distance
          const magnetX = distanceX * strength * 0.4;
          const magnetY = distanceY * strength * 0.4;
          
          customCursor.classList.add('magnetic');
          customCursor.style.transform = \`translate(calc(-50% + \${magnetX}px), calc(-50% + \${magnetY}px))\`;
          
          // Scale the cursor based on proximity
          const scale = 1 + strength * 0.5;
          customCursor.style.width = \`\${20 * scale}px\`;
          customCursor.style.height = \`\${20 * scale}px\`;
        }
      });
      
      // Reset cursor when leaving the element
      el.addEventListener('mouseleave', () => {
        if (!customCursor) return;
        
        customCursor.classList.remove('magnetic');
        customCursor.style.transform = 'translate(-50%, -50%)';
        customCursor.style.width = '20px';
        customCursor.style.height = '20px';
      });
    });
  }`;

module.exports = {
  basic,
  hover,
  click,
  custom,
  interactive
};
