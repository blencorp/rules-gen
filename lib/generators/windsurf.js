const templates = require('../templates/windsurf');

/**
 * Windsurf rule generator
 * Generates windsurf rules based on user selections
 */
class WindsurfGenerator {
  /**
   * Generate windsurf rules based on selected options
   * @param {Array} selectedRules - Array of rule types to generate
   * @returns {string} Combined rule code
   */
  generate(selectedRules) {
    if (!selectedRules || selectedRules.length === 0) {
      return '';
    }

    let combinedRules = `/**
 * Generated Windsurf Rules
 * Created with rules CLI
 */

`;

    // Add comment with selected rules
    combinedRules += `// Selected rules: ${selectedRules.join(', ')}\n\n`;

    // Add common module pattern beginning
    combinedRules += `const WindsurfRules = (function() {
  'use strict';

  // Create windsurf simulation object
  const simulation = {
    active: false,
    config: {},
    elements: {},
    physics: {}
  };

`;

    // Process each selected rule
    selectedRules.forEach(rule => {
      if (templates[rule]) {
        combinedRules += templates[rule] + '\n\n';
      }
    });

    // Add initialization and public methods
    combinedRules += this.generateInitialization(selectedRules);

    // Close module pattern
    combinedRules += `})();

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WindsurfRules;
}`;

    return combinedRules;
  }

  /**
   * Generate initialization code based on selected rules
   * @param {Array} selectedRules - Array of rule types to initialize
   * @returns {string} Initialization code
   */
  generateInitialization(selectedRules) {
    let initialization = `  // Initialize windsurf simulation
  function initialize(config = {}) {
    simulation.config = Object.assign({
      container: document.body,
      windSpeed: 15,
      waveHeight: 1.5,
      difficulty: 'medium'
    }, config);

    // Set up simulation components\n`;

    selectedRules.forEach(rule => {
      switch (rule) {
        case 'basic':
          initialization += '    setupBasicMovement(simulation);\n';
          break;
        case 'physics':
          initialization += '    setupAdvancedPhysics(simulation);\n';
          break;
        case 'wave':
          initialization += '    setupWaveInteraction(simulation);\n';
          break;
        case 'wind':
          initialization += '    setupWindDynamics(simulation);\n';
          break;
        case 'sail':
          initialization += '    setupSailControls(simulation);\n';
          break;
      }
    });

    initialization += `    
    simulation.active = true;
    return simulation;
  }

  // Public API
  return {
    initialize,
    start: function() {
      if (!simulation.active) {
        initialize();
      }
      startSimulation(simulation);
    },
    stop: function() {
      stopSimulation(simulation);
    },
    updateConfig: function(config) {
      simulation.config = Object.assign(simulation.config, config);
    },
    getState: function() {
      return Object.assign({}, simulation);
    }
  };

`;

    return initialization;
  }
}

module.exports = new WindsurfGenerator();
