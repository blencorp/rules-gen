const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const { marked } = require('marked');
const chalk = require('chalk');
const logger = require('./logger');

/**
 * File utility functions for rules generator
 */
class FileUtils {
  /**
   * Check if a file already exists
   * @param {string} filePath - Path to check
   * @returns {boolean} True if file exists
   */
  async fileExists(filePath) {
    try {
      return await fs.pathExists(filePath);
    } catch (error) {
      logger.error(`Error checking if file exists: ${error.message}`);
      return false;
    }
  }

  /**
   * Check if a rule file exists and validate its content
   * @param {string} filePath - Path to the rule file
   * @returns {Promise<{exists: boolean, isValid: boolean, content: string|null}>}
   */
  async checkRuleFile(filePath) {
    try {
      const exists = await this.fileExists(filePath);
      if (!exists) {
        return { exists: false, isValid: false, content: null };
      }

      const content = await fs.readFile(filePath, 'utf8');
      let isValid = true;

      // All rules are in markdown format
      try {
        const tokens = marked.lexer(content);
        isValid = tokens.length > 0;
      } catch {
        isValid = false;
      }

      return { exists, isValid, content };
    } catch (error) {
      logger.error('Error checking rule file:', error);
      return { exists: false, isValid: false, content: null, error };
    }
  }



  /**
   * Merge new rules with existing rules
   * @param {string} existingContent - Existing rule file content
   * @param {string} newContent - New rule content to append
   * @param {string} fileType - Type of rule file ('cursor' or 'windsurf')
   * @returns {string} Merged content
   */
  mergeRules(existingContent, newContent) {
    // Set maximum content length (100KB)
    const MAX_CONTENT_LENGTH = 100 * 1024;
    
    // Get size of existing content
    const existingSize = Buffer.byteLength(existingContent, 'utf8');
    
    // If existing content is already near limit, return it with a note
    if (existingSize > MAX_CONTENT_LENGTH * 0.9) {
      return `${existingContent.trim()}\n\n> Note: New rules were not added due to file size limit.`;
    }
    
    // Calculate remaining space
    const separator = '\n\n---\n\n';
    const remainingSpace = MAX_CONTENT_LENGTH - existingSize - Buffer.byteLength(separator, 'utf8');
    
    // If new content would exceed limit, truncate it
    const newContentSize = Buffer.byteLength(newContent, 'utf8');
    if (newContentSize > remainingSpace) {
      // Split new content into lines
      const lines = newContent.split('\n');
      let truncatedContent = '';
      
      for (const line of lines) {
        const nextLine = truncatedContent ? '\n' + line : line;
        if (Buffer.byteLength(truncatedContent + nextLine, 'utf8') > remainingSpace) {
          truncatedContent += '\n\n> Note: Some rules were truncated due to size limit.';
          break;
        }
        truncatedContent += nextLine;
      }
      
      return `${existingContent.trim()}${separator}${truncatedContent.trim()}`;
    }
    
    // If within limits, merge normally
    return `${existingContent.trim()}${separator}${newContent.trim()}`
  }

  /**
   * Write rule content to a file with conflict resolution
   * @param {string} fileName - Name of the file to write
   * @param {string} content - Content to write to the file
   * @param {boolean} force - Force overwrite without prompting
   * @returns {Promise<void>}
   */
  async writeRuleFile(fileName, content, force = false) {
    try {
      const filePath = path.resolve(process.cwd(), fileName);
      
      // Check if file already exists and is valid
      const { exists, isValid, content: existingContent } = await this.checkRuleFile(filePath);
      
      if (exists && !force) {
        // Check if inquirer is available (we're in interactive mode)
        try {
          const inquirer = require('inquirer');
          
          // Show condensed preview of existing rules if valid
          if (isValid) {
            const lines = existingContent.split('\n');
            const firstLine = lines[0];
            const ruleCount = lines.filter(line => line.trim().startsWith('-')).length;
            
            console.log(chalk.cyan('\nExisting rules file:'));
            console.log(chalk.gray(firstLine));
            console.log(chalk.gray(`Contains ${ruleCount} rules...`));
          }

          const { action } = await inquirer.prompt([
            {
              type: 'list',
              name: 'action',
              message: `File ${fileName} already exists. What would you like to do?`,
              choices: [
                { name: 'Overwrite existing rules', value: 'overwrite' },
                { name: 'Append to existing rules', value: 'append' },
                { name: 'Cancel', value: 'cancel' }
              ]
            }
          ]);
          
          if (action === 'cancel') {
            logger.warning(`Skipped writing to ${fileName}`);
            return;
          }

          if (action === 'append' && isValid) {
            // Merge rules
            content = this.mergeRules(existingContent, content);
          } else if (action === 'overwrite') {

          }
        } catch (err) {
          // In non-interactive mode or if inquirer fails, prompt for overwrite
          logger.warning(`File ${fileName} already exists. Using force flag to overwrite.`);
        }
      }
      
      // Ensure the directory exists
      const dirPath = path.dirname(filePath);
      await this.ensureDirectory(dirPath);
      
      // Write the file
      await fs.writeFile(filePath, content);
      
    } catch (error) {
      logger.error(`Error writing file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a directory if it doesn't exist
   * @param {string} dirPath - Directory path to create
   * @returns {Promise<void>}
   */
  async ensureDirectory(dirPath) {
    try {
      await fs.ensureDir(dirPath);
    } catch (error) {
      logger.error(`Error creating directory: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new FileUtils();
