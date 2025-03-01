#!/usr/bin/env node

const cli = require('../lib/cli');

// Execute the CLI
console.log('Starting Rules Generator CLI...');
cli.run().catch(error => {
  console.error(`Error running CLI: ${error.message}`);
  process.exit(1);
});
