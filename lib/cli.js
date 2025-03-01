const { Command } = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const boxen = require('boxen');
const fs = require('fs-extra');
const path = require('path');

const logger = require('./utils/logger');
const cursorGenerator = require('./generators/cursor');
const windsurfGenerator = require('./generators/windsurf');
const { PRIMARY, SECONDARY, ERROR, INFO } = require('./utils/colors');
const fileUtils = require('./utils/file');

// Helper function to parse boolean values from command line
function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (value === 'false') return false;
  if (value === 'true') return true;
  return true; // Default to true if not specified
}

// Main CLI class
class CLI {
  constructor() {
    this.program = new Command();
    this.setupProgram();
  }

  setupProgram() {
    this.program
      .name('rules')
      .description('Interactive CLI to generate cursor and windsurf rules')
      .version('1.0.0')
      .option('-t, --type <type>', 'Rule type (cursor, windsurf, or all)')
      .option('-r, --rules <rules>', 'Specific rules to generate (comma-separated)')
      .option('-i, --interactive <boolean>', 'Use interactive prompts', parseBoolean, true)
      .option('-f, --force', 'Force overwrite existing files without prompting')
      .allowUnknownOption(true)
      .action(this.actionHandler.bind(this));
  }

  async actionHandler(options) {
    try {
      logger.welcomeMessage();
      
      let ruleTypes = [];
      let specificRulesByType = {};
      
      // Check if we're using command-line arguments or interactive mode
      if (options.type && options.interactive === false) {
        // Non-interactive mode with command-line arguments
        if (options.type === 'all') {
          ruleTypes = ['cursor', 'windsurf'];
        } else if (options.type === 'cursor' || options.type === 'windsurf') {
          ruleTypes = [options.type];
        } else {
          logger.error(`Invalid rule type: ${options.type}. Use 'cursor', 'windsurf', or 'all'.`);
          return;
        }
        
        // Process specific rules if provided
        if (options.rules) {
          const rules = options.rules.split(',').map(rule => rule.trim());
          
          // Assign rules to their respective type
          ruleTypes.forEach(type => {
            if (type === 'cursor') {
              const validCursorRules = ['basic', 'hover', 'click', 'custom', 'interactive'];
              specificRulesByType.cursor = rules.filter(rule => validCursorRules.includes(rule));
              
              if (specificRulesByType.cursor.length === 0) {
                specificRulesByType.cursor = validCursorRules; // Default to all if none valid
              }
            } else if (type === 'windsurf') {
              const validWindsurfRules = ['basic', 'physics', 'wave', 'wind', 'sail'];
              specificRulesByType.windsurf = rules.filter(rule => validWindsurfRules.includes(rule));
              
              if (specificRulesByType.windsurf.length === 0) {
                specificRulesByType.windsurf = validWindsurfRules; // Default to all if none valid
              }
            }
          });
        }
      } else {
        // Interactive mode
        ruleTypes = await this.promptRuleTypes();
      }
      
      if (ruleTypes.length === 0) {
        logger.warning('No rule types selected. Exiting...');
        return;
      }
      
      // Process each selected rule type
      for (const ruleType of ruleTypes) {
        if (options.interactive !== false || !specificRulesByType[ruleType]) {
          await this.processRuleType(ruleType, options.force);
        } else {
          // Non-interactive mode with specific rules
          await this.processNonInteractiveRules(ruleType, specificRulesByType[ruleType], options.force);
        }
      }
      
      logger.success('All selected rules have been generated successfully!');
      
    } catch (error) {
      logger.error(`Error generating rules: ${error.message}`);
      throw error;
    }
  }

  async promptRuleTypes() {
    const { ruleTypes } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'ruleTypes',
        message: 'Select rule types to generate:',
        choices: [
          { name: 'Cursor Rules', value: 'cursor' },
          { name: 'Windsurf Rules', value: 'windsurf' }
        ],
        validate: (answer) => {
          if (answer.length < 1) {
            return 'You must select at least one rule type.';
          }
          return true;
        }
      }
    ]);

    return ruleTypes;
  }

  async processRuleType(ruleType, force = false) {
    logger.info(`\nProcessing ${ruleType} rules...`);
    
    let specificRules = [];
    let generatedCode = '';

    // Get specific rules based on the type
    if (ruleType === 'cursor') {
      specificRules = await this.promptCursorRules();
      const spinner = ora('Generating cursor rules...').start();
      generatedCode = cursorGenerator.generate(specificRules);
      spinner.succeed('Cursor rules generated!');
    } else if (ruleType === 'windsurf') {
      specificRules = await this.promptWindsurfRules();
      const spinner = ora('Generating windsurf rules...').start();
      generatedCode = windsurfGenerator.generate(specificRules);
      spinner.succeed('Windsurf rules generated!');
    }

    // Write the rules to a file
    const fileName = `${ruleType}-rules.js`;
    await fileUtils.writeRuleFile(fileName, generatedCode, force);
    logger.success(`${ruleType} rules saved to ${fileName}`);
  }

  async promptCursorRules() {
    const { cursorRules } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'cursorRules',
        message: 'Select specific cursor rules to generate:',
        choices: [
          { name: 'Basic Cursor', value: 'basic' },
          { name: 'Hover Effects', value: 'hover' },
          { name: 'Click Animation', value: 'click' },
          { name: 'Custom Cursor Image', value: 'custom' },
          { name: 'Interactive Cursor', value: 'interactive' }
        ],
        validate: (answer) => {
          if (answer.length < 1) {
            return 'You must select at least one cursor rule.';
          }
          return true;
        }
      }
    ]);

    return cursorRules;
  }

  async promptWindsurfRules() {
    const { windsurfRules } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'windsurfRules',
        message: 'Select specific windsurf rules to generate:',
        choices: [
          { name: 'Basic Windsurf Movement', value: 'basic' },
          { name: 'Advanced Physics', value: 'physics' },
          { name: 'Wave Interaction', value: 'wave' },
          { name: 'Wind Dynamics', value: 'wind' },
          { name: 'Sail Controls', value: 'sail' }
        ],
        validate: (answer) => {
          if (answer.length < 1) {
            return 'You must select at least one windsurf rule.';
          }
          return true;
        }
      }
    ]);

    return windsurfRules;
  }

  async processNonInteractiveRules(ruleType, specificRules, force = true) {
    logger.info(`\nProcessing ${ruleType} rules (non-interactive mode)...`);
    
    let generatedCode = '';
    
    // Generate code based on rule type
    if (ruleType === 'cursor') {
      const spinner = ora('Generating cursor rules...').start();
      generatedCode = cursorGenerator.generate(specificRules);
      spinner.succeed('Cursor rules generated!');
    } else if (ruleType === 'windsurf') {
      const spinner = ora('Generating windsurf rules...').start();
      generatedCode = windsurfGenerator.generate(specificRules);
      spinner.succeed('Windsurf rules generated!');
    }
    
    // Write the rules to a file (force=true for non-interactive mode)
    const fileName = `${ruleType}-rules.js`;
    await fileUtils.writeRuleFile(fileName, generatedCode, force);
    logger.success(`${ruleType} rules saved to ${fileName}`);
  }

  async run() {
    try {
      // Use a custom parsing approach to avoid Commander's handling of unknown args
      this.program.parse(process.argv);
    } catch (error) {
      logger.error(`Error running CLI: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new CLI();