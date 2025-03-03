const fs = require('fs-extra');
const path = require('path');
const fileUtils = require('../utils/file');

/**
 * Windsurf rule generator
 * Generates .windsurfrules files in markdown format
 */
class WindsurfGenerator {
  /**
   * Generate windsurf rules based on rule object
   * @param {Object} rule - Rule object containing name and content
   * @param {string} outputPath - Path to output directory
   * @returns {Object} Result object with success status and file path
   */
  async generate(rule, outputPath, force = false) {
    try {
      const ruleContent = this.generateWindsurfRules(rule);
      const ruleFile = path.join(outputPath, '.windsurfrules');

      // Ensure directory exists
      await fs.ensureDir(path.dirname(ruleFile));

      // Write or append to .windsurfrules file using fileUtils
      await fileUtils.writeRuleFile(ruleFile, ruleContent, force);

      return {
        success: true,
        filePath: ruleFile
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate windsurf rules content in markdown format
   * @param {Object} rule - Rule object containing name and content
   * @returns {string} Markdown formatted content
   */
  generateWindsurfRules(rule) {
    // Set maximum content length (100KB)
    const MAX_CONTENT_LENGTH = 100 * 1024;
    let rulesContent = `# ${rule.name}\n\n`;

    // Process rule content
    if (typeof rule.content === 'object') {
      // Handle structured content
      if (rule.content.rules) {
        const rulesByCategory = this.categorizeRules(rule.content.rules);
        
        // Add each category with markdown headers
        Object.entries(rulesByCategory).forEach(([category, rules]) => {
          rulesContent += `## ${category}\n`;
          rules.forEach(rule => {
            rulesContent += `- ${rule}\n`;
          });
          rulesContent += '\n';
        });
      }
    } else if (typeof rule.content === 'string') {
      // Handle plain text content
      // Split content into lines and filter out empty lines
      const lines = rule.content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      // Add lines while checking size limit
      for (const line of lines) {
        const nextContent = rulesContent + line + '\n';
        if (Buffer.byteLength(nextContent, 'utf8') > MAX_CONTENT_LENGTH) {
          rulesContent += '\n> Note: Some rules were truncated due to size limit.';
          break;
        }
        rulesContent += line + '\n';
      }
    }

    return rulesContent;
  }

  /**
   * Categorize rules into sections
   * @param {Array} rules - Array of rule strings
   * @returns {Object} Categorized rules
   */
  categorizeRules(rules) {
    const categories = {
      coding_guidelines: [],
      project_setup: [],
      best_practices: [],
      conventions: [],
      uncategorized: []
    };

    rules.forEach(rule => {
      if (rule.toLowerCase().includes('code') || rule.toLowerCase().includes('programming')) {
        categories.coding_guidelines.push(rule);
      } else if (rule.toLowerCase().includes('setup') || rule.toLowerCase().includes('install')) {
        categories.project_setup.push(rule);
      } else if (rule.toLowerCase().includes('practice') || rule.toLowerCase().includes('pattern')) {
        categories.best_practices.push(rule);
      } else if (rule.toLowerCase().includes('convention') || rule.toLowerCase().includes('standard')) {
        categories.conventions.push(rule);
      } else {
        categories.uncategorized.push(rule);
      }
    });

    // Remove empty categories
    return Object.fromEntries(
      Object.entries(categories).filter(([_, rules]) => rules.length > 0)
    );
  }
}

module.exports = new WindsurfGenerator();
