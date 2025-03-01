const chalk = require('chalk');

// Define color constants based on requirements
const PRIMARY = '#00FF00'; // Success green
const SECONDARY = '#FFFF00'; // Warning yellow
const ERROR = '#FF0000'; // Error red
const INFO = '#00FFFF'; // Info blue

// Export color-themed text formatters
module.exports = {
  PRIMARY,
  SECONDARY,
  ERROR,
  INFO,
  
  // Success message (green)
  success: text => chalk.hex(PRIMARY)(text),
  
  // Warning message (yellow)
  warning: text => chalk.hex(SECONDARY)(text),
  
  // Error message (red)
  error: text => chalk.hex(ERROR)(text),
  
  // Info message (blue)
  info: text => chalk.hex(INFO)(text),
  
  // Highlight text (bold white)
  highlight: text => chalk.bold.white(text),
  
  // Dim text for less important info
  dim: text => chalk.dim(text)
};
