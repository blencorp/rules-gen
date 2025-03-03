const { Command } = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const boxen = require('boxen');
const fs = require('fs-extra');
const path = require('path');

const logger = require('./utils/logger');
const { getRelevantRules } = require('./utils/stackDetector');
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
  SEARCH_CATEGORY: '🔍 Search in this category...',
  CLEAR_SEARCH: '❌ Clear search',
  PROJECT_BASED: 'Based on your project',
  MANUAL_SELECTION: 'Start fresh with manual selection'
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
    const initialChoice = await this.promptInitialChoice();
    
    if (initialChoice === SPECIAL_ACTIONS.PROJECT_BASED) {
      const spinner = ora('Analyzing project and rules...').start();
      try {
        const { projectTechnologies, rules: matchedRules } = await getRelevantRules(rulesData);
        spinner.succeed('Analysis complete');
        
        if (matchedRules.length === 0) {
          logger.warning('No relevant rules found for your project');
          return this.handleInteractiveMode();
        }

        // Log detected technologies
        console.log(chalk.cyan('\nDetected technologies in your project:'));
        projectTechnologies.forEach(tech => {
          console.log(chalk.gray(`• ${tech}`));
        });

        // Create choices grouped by matching technologies
        const choices = [
          { name: SPECIAL_ACTIONS.BACK, value: SPECIAL_ACTIONS.BACK },
          new inquirer.Separator()
        ];

        matchedRules.forEach(({ category, rule, projectMatch }) => {
          const matchingTechs = projectMatch.join(', ');
          choices.push({
            name: `${category} > ${rule.name} ${chalk.gray(`(matches: ${matchingTechs})`)}`,
            value: { category, rule }
          });
        });

        const { selectedRule } = await inquirer.prompt([
          {
            type: 'list',
            name: 'selectedRule',
            message: 'Select a rule that matches your project:',
            choices,
            pageSize: 20
          }
        ]);

        if (selectedRule === SPECIAL_ACTIONS.BACK) {
          return this.handleInteractiveMode();
        }

        const currentState = NAV_STATES.IDE;
        const category = selectedRule.category;
        const rules = [selectedRule.rule];
        const breadcrumb = `${category} > ${rules[0].name}`;

        const selectedTypes = await this.promptIdeType(
          rules[0].name,
          breadcrumb
        );

        if (selectedTypes === SPECIAL_ACTIONS.BACK) {
          return this.handleInteractiveMode();
        }

        // Generate the rules for each selected IDE type
        for (const ideType of selectedTypes) {
          await this.processRules(category, rules, ideType);
        }
        return;

      } catch (error) {
        spinner.fail('Error analyzing project');
        logger.error(error.message);
        return this.handleInteractiveMode();
      }
    }

    let currentState = NAV_STATES.CATEGORY;
    let breadcrumb = '';
    let category = null;
    let rules = null;
    
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
              rules = [searchResult.rule];
              breadcrumb = `${category} > ${rules[0].name}`;
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
              
              rules = [searchResult.rule];
              breadcrumb = `${category} > ${rules[0].name}`;
              currentState = NAV_STATES.IDE;
            } else {
              rules = selected;
              const ruleNames = rules.map(r => r.name).join(', ');
              breadcrumb = `${category} > ${ruleNames}`;
              currentState = NAV_STATES.IDE;
            }
            break;
          }
          
          case NAV_STATES.IDE: {
            const selectedTypes = await this.promptIdeType(
              rules.length > 1 ? 'selected rules' : rules[0].name,
              breadcrumb
            );
            if (selectedTypes === SPECIAL_ACTIONS.BACK) {
              currentState = NAV_STATES.RULE;
              breadcrumb = category;
              rules = null;
            } else {
              // Generate the rules for each selected IDE type
              for (const ideType of selectedTypes) {
                await this.processRules(category, rules, ideType);
              }
              // Return to category selection
              currentState = NAV_STATES.CATEGORY;
              breadcrumb = '';
              category = null;
              rules = null;
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
        rules = null;
      }
    }
  }

  async promptInitialChoice() {
    const { selected } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message: 'How would you like to select rules?',
        choices: [
          { name: SPECIAL_ACTIONS.PROJECT_BASED, value: SPECIAL_ACTIONS.PROJECT_BASED },
          { name: SPECIAL_ACTIONS.MANUAL_SELECTION, value: SPECIAL_ACTIONS.MANUAL_SELECTION }
        ]
      }
    ]);
    return selected;
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

    // Add back and clear search options
    results.unshift(
      { name: SPECIAL_ACTIONS.BACK, value: SPECIAL_ACTIONS.BACK },
      { name: SPECIAL_ACTIONS.CLEAR_SEARCH, value: SPECIAL_ACTIONS.CLEAR_SEARCH }
    );

    const { selected } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message: 'Search results:',
        choices: results,
        pageSize: 20
      }
    ]);

    if (selected === SPECIAL_ACTIONS.CLEAR_SEARCH) {
      return null;
    }

    return selected;
  }

  async processRules(category, rules, ideType) {
    logger.info(`\nProcessing ${rules.length} rules for ${ideType}...`);
    
    const spinner = ora(`Generating ${ideType} rules...`).start();
    const results = [];
    
    try {
      for (const rule of rules) {
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

        // Get current working directory
        const outputPath = process.cwd();
        let result;

        // Generate rules based on IDE type
        if (ideType === 'cursor') {
          result = await cursorGenerator.generate(rule, outputPath);
        } else if (ideType === 'windsurf') {
          result = await windsurfGenerator.generate(rule, outputPath);
        }

        if (result.success) {
          results.push(result);
        } else {
          throw new Error(result.error);
        }
      }

      spinner.succeed(`${ideType} rules generated!`);
      results.forEach(result => {
        logger.success(`Rule saved to ${result.filePath}`);
      });
    } catch (error) {
      spinner.fail(`Error processing rules: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate a URL-friendly slug from a string
   * @param {string} str - String to convert to slug
   * @returns {string} URL-friendly slug
   */
  generateSlug(str) {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async promptRulesForCategory(category, breadcrumb) {
    // Get rules for the selected category
    const categoryRules = rulesData[category]?.rules || [];
    const ruleChoices = categoryRules.map(rule => {
      // Add slug to the rule object
      rule.slug = this.generateSlug(rule.name);
      return {
        name: rule.name,
        value: rule
      };
    });

    const choices = [
      { name: SPECIAL_ACTIONS.BACK, value: SPECIAL_ACTIONS.BACK },
      { name: SPECIAL_ACTIONS.SEARCH_CATEGORY, value: SPECIAL_ACTIONS.SEARCH_CATEGORY },
      new inquirer.Separator()
    ].concat(ruleChoices);

    const { selected } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selected',
        message: `${breadcrumb} > Select rules:`,
        choices: choices.filter(choice => 
          choice.value !== SPECIAL_ACTIONS.BACK && 
          choice.value !== SPECIAL_ACTIONS.SEARCH_CATEGORY
        ),
        validate: (answer) => {
          if (answer.length < 1) {
            return 'You must select at least one rule.';
          }
          return true;
        },
        pageSize: 20
      }
    ]);

    return selected;
  }

  async promptIdeType(ruleName, breadcrumb) {
    const answers = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'ideTypes',
        message: `${breadcrumb} > Generate rules for:`,
        choices: [
          { name: 'Cursor', value: 'cursor' },
          { name: 'Windsurf', value: 'windsurf' }
        ],
        validate: (answer) => {
          if (answer.length < 1) {
            return 'You must select at least one IDE type.';
          }
          return true;
        }
      },
      {
        type: 'list',
        name: 'action',
        message: 'Proceed with generation?',
        choices: [
          { name: 'Yes, generate rules', value: 'generate' },
          { name: SPECIAL_ACTIONS.BACK, value: SPECIAL_ACTIONS.BACK }
        ],
        when: (answers) => answers.ideTypes.length > 0
      }
    ]);

    if (!answers.action || answers.action === SPECIAL_ACTIONS.BACK) {
      return SPECIAL_ACTIONS.BACK;
    }

    return answers.ideTypes;
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