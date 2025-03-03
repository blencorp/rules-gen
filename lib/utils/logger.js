const chalk = require('chalk');
const boxen = require('boxen');
const colors = require('./colors');

/**
 * Logger utility for standardized console output
 */
class Logger {
  /**
   * Display welcome message
   */
  welcomeMessage() {
    const message = boxen(
      `${colors.highlight('Rules Generator CLI')}\n\n` +
      `Generate ${colors.info('Cursor')} and ${colors.info('Windsurf')} rules`,
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
        align: 'center'
      }
    );
    
    console.log(message);
  }

  /**
   * Display success message
   * @param {string} message - Success message to display
   */
  success(message) {
    console.log(`${colors.success('✓ SUCCESS:')} ${message}`);
  }

  /**
   * Display warning message
   * @param {string} message - Warning message to display
   */
  warning(message) {
    console.log(`${colors.warning('⚠ WARNING:')} ${message}`);
  }

  /**
   * Display error message
   * @param {string} message - Error message to display
   */
  error(message) {
    console.log(`${colors.error('✗ ERROR:')} ${message}`);
  }

  /**
   * Display info message
   * @param {string} message - Info message to display
   */
  info(message) {
    console.log(`${colors.info('ℹ INFO:')} ${message}`);
  }

  /**
   * Display a divider line
   */
  divider() {
    console.log(colors.dim('----------------------------------------'));
  }

  /**
   * Display a section title
   * @param {string} title - Section title to display
   */
  section(title) {
    this.divider();
    console.log(colors.highlight(title.toUpperCase()));
    this.divider();
  }
}

module.exports = new Logger();
