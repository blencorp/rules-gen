const assert = require('assert');
const path = require('path');
const cli = require('../lib/cli');

describe('CLI', () => {
  it('should have correct program name', () => {
    assert.strictEqual(cli.program.name(), 'rules');
  });

  it('should have correct version', () => {
    assert.strictEqual(cli.program.version(), '0.1.0');
  });

  it('should have required options', () => {
    const options = cli.program.opts();
    assert(cli.program.options.some(opt => opt.long === '--type'));
    assert(cli.program.options.some(opt => opt.long === '--rules'));
    assert(cli.program.options.some(opt => opt.long === '--interactive'));
    assert(cli.program.options.some(opt => opt.long === '--force'));
  });
});
