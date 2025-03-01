const templates = require('../templates/cursor');

/**
 * Cursor rule generator
 * Generates cursor rules based on user selections
 */
class CursorGenerator {
  /**
   * Generate cursor rules based on selected options
   * @param {Array} selectedRules - Array of rule types to generate
   * @returns {string} Combined rule code
   */
  generate(selectedRules) {
    if (!selectedRules || selectedRules.length === 0) {
      return '';
    }

    let combinedRules = `/**
 * Generated Cursor Rules
 * Created with rules CLI
 */

`;

    // Add comment with selected rules
    combinedRules += `// Selected rules: ${selectedRules.join(', ')}\n\n`;

    // Add common module pattern beginning
    combinedRules += `(function() {
  'use strict';

`;

    // Process each selected rule
    selectedRules.forEach(rule => {
      if (templates[rule]) {
        combinedRules += templates[rule] + '\n\n';
      }
    });

    // Add initialization code
    combinedRules += this.generateInitialization(selectedRules);

    // Close module pattern
    combinedRules += `})();`;

    return combinedRules;
  }

  /**
   * Generate initialization code based on selected rules
   * @param {Array} selectedRules - Array of rule types to initialize
   * @returns {string} Initialization code
   */
  generateInitialization(selectedRules) {
    let initialization = `  // Initialize cursor rules
  function initCursorRules() {\n`;

    selectedRules.forEach(rule => {
      switch (rule) {
        case 'basic':
          initialization += '    setupBasicCursor();\n';
          break;
        case 'hover':
          initialization += '    setupHoverEffects();\n';
          break;
        case 'click':
          initialization += '    setupClickAnimation();\n';
          break;
        case 'custom':
          initialization += '    setupCustomCursor();\n';
          break;
        case 'interactive':
          initialization += '    setupInteractiveCursor();\n';
          break;
      }
    });

    initialization += `  }

  // Run initialization when DOM is fully loaded
  document.addEventListener('DOMContentLoaded', initCursorRules);

`;

    return initialization;
  }
}

module.exports = new CursorGenerator();
