const assert = require('assert');
const path = require('path');
const cli = require('../lib/cli');
const { version } = require('../package.json');

describe('CLI', () => {
  it('should have correct program name', () => {
    assert.strictEqual(cli.program.name(), 'rules');
  });

  it('should have correct version', () => {
    assert.strictEqual(cli.program.version(), version);
  });

  it('should have required options', () => {
    const options = cli.program.opts();
    assert(cli.program.options.some(opt => opt.long === '--type'));
    assert(cli.program.options.some(opt => opt.long === '--rules'));
    assert(cli.program.options.some(opt => opt.long === '--interactive'));
    assert(cli.program.options.some(opt => opt.long === '--force'));
  });
});
