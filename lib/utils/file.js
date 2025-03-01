const fs = require('fs-extra');
const path = require('path');
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
   * Write rule content to a file
   * @param {string} fileName - Name of the file to write
   * @param {string} content - Content to write to the file
   * @param {boolean} force - Force overwrite without prompting
   * @returns {Promise<void>}
   */
  async writeRuleFile(fileName, content, force = false) {
    try {
      const filePath = path.resolve(process.cwd(), fileName);
      
      // Check if file already exists
      const exists = await this.fileExists(filePath);
      
      if (exists && !force) {
        // Check if inquirer is available (we're in interactive mode)
        try {
          const inquirer = require('inquirer');
          const { overwrite } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'overwrite',
              message: `File ${fileName} already exists. Overwrite?`,
              default: false
            }
          ]);
          
          if (!overwrite) {
            logger.warning(`Skipped writing to ${fileName}`);
            return;
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
