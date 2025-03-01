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
const { version } = require('../package.json');

// Load rules from rules.json
const rulesPath = path.join(__dirname, '../data/rules.json');
const rulesData = fs.readJsonSync(rulesPath, { throws: false }) || {};

// Navigation states
const NAV_STATES = {
  CATEGORY: 'category',
  RULE: 'rule',
  IDE: 'ide'
};

// Special action values
const SPECIAL_ACTIONS = {
  BACK: '<<< Back',
  SEARCH: '🔍 Search...',
  SEARCH_CATEGORY: '🔍 Search in this category...'
};

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
      .version(version)
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
      
      if (options.type && options.interactive === false) {
        // Handle non-interactive mode
        await this.handleNonInteractiveMode(options);
      } else {
        // Interactive mode
        await this.handleInteractiveMode();
      }
      
    } catch (error) {
      logger.error(`Error generating rules: ${error.message}`);
      throw error;
    }
  }

  async handleInteractiveMode() {
    let currentState = NAV_STATES.CATEGORY;
    let breadcrumb = '';
    let category = null;
    let rule = null;
    
    while (true) {
      try {
        switch (currentState) {
          case NAV_STATES.CATEGORY: {
            const selected = await this.promptCategory(breadcrumb);
            if (selected === SPECIAL_ACTIONS.SEARCH) {
              const searchResult = await this.promptSearch();
              if (searchResult === SPECIAL_ACTIONS.BACK) continue;
              if (!searchResult) continue;
              
              category = searchResult.category;
              rule = searchResult.rule;
              breadcrumb = `${category} > ${rule.name}`;
              currentState = NAV_STATES.IDE;
            } else {
              category = selected;
              breadcrumb = category;
              currentState = NAV_STATES.RULE;
            }
            break;
          }
          
          case NAV_STATES.RULE: {
            const selected = await this.promptRulesForCategory(category, breadcrumb);
            if (selected === SPECIAL_ACTIONS.BACK) {
              currentState = NAV_STATES.CATEGORY;
              breadcrumb = '';
              category = null;
            } else if (selected === SPECIAL_ACTIONS.SEARCH_CATEGORY) {
              const searchResult = await this.promptSearch(category);
              if (searchResult === SPECIAL_ACTIONS.BACK) continue;
              if (!searchResult) continue;
              
              rule = searchResult.rule;
              breadcrumb = `${category} > ${rule.name}`;
              currentState = NAV_STATES.IDE;
            } else {
              rule = selected;
              breadcrumb = `${category} > ${rule.name}`;
              currentState = NAV_STATES.IDE;
            }
            break;
          }
          
          case NAV_STATES.IDE: {
            const selected = await this.promptIdeType(rule.name, breadcrumb);
            if (selected === SPECIAL_ACTIONS.BACK) {
              currentState = NAV_STATES.RULE;
              breadcrumb = category;
              rule = null;
            } else {
              // Generate the rule
              await this.processRule(category, rule, selected);
              // Return to category selection
              currentState = NAV_STATES.CATEGORY;
              breadcrumb = '';
              category = null;
              rule = null;
            }
            break;
          }
        }
      } catch (error) {
        logger.error(`Error: ${error.message}`);
        // On error, return to category selection
        currentState = NAV_STATES.CATEGORY;
        breadcrumb = '';
        category = null;
        rule = null;
      }
    }
  }

  async promptCategory(breadcrumb = '') {
    // Get available categories from rules.json
    const categories = Object.keys(rulesData).map(category => ({
      name: category,
      value: category
    }));

    const choices = [
      { name: SPECIAL_ACTIONS.SEARCH, value: SPECIAL_ACTIONS.SEARCH },
      new inquirer.Separator()
    ].concat(categories);

    const { selected } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message: breadcrumb ? `${breadcrumb} > Select a category:` : 'Select a category:',
        choices,
        pageSize: 20
      }
    ]);

    return selected;
  }

  async promptSearch(category = null) {
    const { searchTerm } = await inquirer.prompt([
      {
        type: 'input',
        name: 'searchTerm',
        message: category ? `Search in ${category}:` : 'Search all rules:',
        validate: (input) => input.length >= 2 ? true : 'Please enter at least 2 characters'
      }
    ]);

    // Perform search
    const results = [];
    for (const [categoryName, categoryData] of Object.entries(rulesData)) {
      if (category && category !== categoryName) continue;
      
      if (categoryData && Array.isArray(categoryData.rules)) {
        const matchingRules = categoryData.rules.filter(rule => {
          const searchLower = searchTerm.toLowerCase();
          const nameLower = rule.name.toLowerCase();
          const descLower = (rule.description || '').toLowerCase();
          const contentStr = typeof rule.content === 'object' ? 
            JSON.stringify(rule.content).toLowerCase() : 
            (rule.content || '').toLowerCase();

          return nameLower.includes(searchLower) || 
                 descLower.includes(searchLower) || 
                 contentStr.includes(searchLower);
        });

        matchingRules.forEach(rule => {
          results.push({
            name: `${categoryName} > ${rule.name}`,
            value: { category: categoryName, rule }
          });
        });
      }
    }

    if (results.length === 0) {
      logger.warning('No matches found');
      return null;
    }

    // Add back option
    results.unshift({ name: SPECIAL_ACTIONS.BACK, value: SPECIAL_ACTIONS.BACK });

    const { selected } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message: 'Search results:',
        choices: results,
        pageSize: 20
      }
    ]);

    return selected;
  }

  async processRule(category, rule, ideType) {
    logger.info(`\nProcessing ${rule.name} for ${ideType}...`);
    
    let generatedCode = '';
    const spinner = ora(`Generating ${ideType} rule...`).start();
    
    try {
      // Fetch the rule content from the raw URL if it exists
      if (rule.rawUrl) {
        const response = await fetch(rule.rawUrl);
        if (response.ok) {
          const content = await response.text();
          rule.content = content;
        } else {
          throw new Error(`Could not fetch content for rule: ${rule.name}`);
        }
      }

      // Generate code based on the IDE type
      if (rule.content) {
        if (ideType === 'cursor') {
          generatedCode = cursorGenerator.generate(['basic', 'hover', 'click', 'custom', 'interactive']);
        } else if (ideType === 'windsurf') {
          generatedCode = windsurfGenerator.generate(['basic', 'physics', 'wave', 'wind', 'sail']);
        }
      }

      spinner.succeed(`${ideType} rule generated!`);

      // Write the rule to a file
      const fileName = `${rule.name.toLowerCase().replace(/ /g, '-')}-${ideType}-rule.js`;
      await fileUtils.writeRuleFile(fileName, generatedCode, true);
      logger.success(`Rule saved to ${fileName}`);
    } catch (error) {
      spinner.fail(`Error processing rule: ${error.message}`);
      throw error;
    }
  }

  async promptRulesForCategory(category, breadcrumb) {
    // Get rules for the selected category
    const categoryRules = rulesData[category]?.rules || [];
    const ruleChoices = categoryRules.map(rule => ({
      name: rule.name,
      value: rule
    }));

    const choices = [
      { name: SPECIAL_ACTIONS.BACK, value: SPECIAL_ACTIONS.BACK },
      { name: SPECIAL_ACTIONS.SEARCH_CATEGORY, value: SPECIAL_ACTIONS.SEARCH_CATEGORY },
      new inquirer.Separator()
    ].concat(ruleChoices);

    const { selected } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message: `${breadcrumb} > Select a rule:`,
        choices,
        pageSize: 20
      }
    ]);

    return selected;
  }

  async promptIdeType(ruleName, breadcrumb) {
    const { selected } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message: `${breadcrumb} > Generate rule for:`,
        choices: [
          { name: 'Cursor', value: 'cursor' },
          { name: 'Windsurf', value: 'windsurf' },
          { name: SPECIAL_ACTIONS.BACK, value: SPECIAL_ACTIONS.BACK }
        ]
      }
    ]);

    return selected;
  }



  async processNonInteractiveRules(category, specificRules, force = true) {
    logger.info(`\nProcessing ${category} rules (non-interactive mode)...`);
    
    let generatedCode = '';
    const spinner = ora(`Generating ${category} rules...`).start();

    // Process each rule
    for (const ruleName of specificRules) {
      const rule = rulesData[category]?.rules?.find(r => r.name === ruleName);
      if (rule) {
        try {
          // Fetch the rule content from the raw URL if it exists
          if (rule.rawUrl) {
            const response = await fetch(rule.rawUrl);
            if (response.ok) {
              const content = await response.text();
              generatedCode += `// ${rule.name}\n`;
              generatedCode += content;
              generatedCode += '\n\n';
            } else {
              logger.warning(`Could not fetch content for rule: ${rule.name}`);
            }
          }
        } catch (error) {
          logger.warning(`Error processing rule ${rule.name}: ${error.message}`);
        }
      } else {
        logger.warning(`Rule not found: ${ruleName}`);
      }
    }

    spinner.succeed(`${category} rules generated!`);

    // Write the rules to a file
    const fileName = `${category.toLowerCase().replace(/ /g, '-')}-rules.js`;
    await fileUtils.writeRuleFile(fileName, generatedCode, force);
    logger.success(`${category} rules saved to ${fileName}`);
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