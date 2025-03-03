const fs = require('fs-extra');
const path = require('path');
const fileUtils = require('../utils/file');

/**
 * Cursor rule generator
 * Generates cursor rules in .mdc format
 */
class CursorGenerator {
  /**
   * Generate cursor rules based on selected options
   * @param {Object} rule - Rule object containing name and content
   * @param {string} outputPath - Path to output directory
   * @returns {Object} Result object with success status and file path
   */
  async generate(rule, outputPath, force = false) {
    try {
      const ruleContent = this.generateMdcContent(rule);
      const rulePath = path.join(outputPath, '.cursor', 'rules');
      
      // Generate slug from rule name if not provided
      const slug = rule.slug || rule.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const ruleFile = path.join(rulePath, `${slug}.mdc`);

      // Ensure directory exists
      await fs.ensureDir(rulePath);

      // Write the .mdc file using fileUtils
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
   * Generate MDC content for a rule
   * @param {Object} rule - Rule object containing name and content
   * @returns {string} MDC formatted content
   */
  generateMdcContent(rule) {
    const patterns = this.extractPatterns(rule.content);
    const description = this.extractDescription(rule.content);
    const fileRefs = this.extractFileReferences(rule.content);
    
    let mdcContent = `# ${rule.name}\n`;
    mdcContent += `description: "${description}"\n\n`;
    
    if (patterns.length > 0) {
      mdcContent += 'patterns:\n';
      patterns.forEach(pattern => {
        mdcContent += `  - "${pattern}"\n`;
      });
      mdcContent += '\n';
    }

    // Add file references only if they exist
    if (fileRefs.length > 0) {
      fileRefs.forEach(fileRef => {
        mdcContent += `@file ${fileRef}\n`;
      });
      mdcContent += '\n';
    }

    // Add rules section
    mdcContent += '## Rules\n';
    if (typeof rule.content === 'object' && rule.content.rules) {
      rule.content.rules.forEach(ruleItem => {
        mdcContent += `- ${ruleItem}\n`;
      });
    } else if (typeof rule.content === 'string') {
      mdcContent += rule.content;
    }

    return mdcContent;
  }

  /**
   * Extract file patterns from rule content
   * @param {Object|string} content - Rule content
   * @returns {Array} Array of glob patterns
   */
  extractPatterns(content) {
    const patterns = [];
    if (typeof content === 'object' && content.patterns) {
      return content.patterns;
    }
    // Extract patterns from content string if needed
    return patterns;
  }

  /**
   * Extract description from rule content
   * @param {Object|string} content - Rule content
   * @returns {string} Rule description
   */
  extractDescription(content) {
    if (typeof content === 'object' && content.description) {
      return content.description;
    }
    return 'Generated Cursor rule';
  }

  /**
   * Extract and validate file references from rule content
   * @param {Object|string} content - Rule content
   * @returns {Array} Array of valid file references
   */
  extractFileReferences(content) {
    const fileRefs = [];
    if (typeof content === 'object' && Array.isArray(content.files)) {
      // Only include files that actually exist in the project
      content.files.forEach(file => {
        const absolutePath = path.resolve(process.cwd(), file);
        if (fs.existsSync(absolutePath)) {
          fileRefs.push(file);
        }
      });
    }
    return fileRefs;
  }
}

module.exports = new CursorGenerator();
