# Rules Generator CLI

An interactive CLI tool that generates cursor and windsurf rules based on user selections.

## Features

- Interactive prompts for selecting rule types and specific rules
- Non-interactive mode for CI/CD or scripting
- Two rule categories: cursor and windsurf
- Multiple rule options for each category
- Modern, user-friendly terminal UI

## Installation

### Using npx (without installation) - recommended - the rulelist gets updated daily

```bash
npx rules-gen
```

### Global Installation

```bash
npm install -g rules-gen
```

## Usage

### Interactive Mode

Simply run the CLI without arguments to use the interactive mode:

```bash
rules-gen
```

or

```bash
npx rules-gen
```

### Non-Interactive Mode

Use command-line arguments to generate rules without prompts:

```bash
# Generate specific cursor rules
rules --type cursor --rules basic,hover --interactive false

# Generate all windsurf rules
rules --type windsurf --interactive false

# Generate both cursor and windsurf rules
rules --type all --interactive false

# Force overwrite existing files
rules --type cursor --rules basic,hover --interactive false --force
```

## How It Works

The CLI generates JavaScript files with the selected rules. For example, selecting cursor rules with 'basic' and 'hover' options will generate a `cursor-rules.js` file that can be included in your web projects.

## Development

### Prerequisites

- Node.js 14 or higher

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/username/rules-gen.git
   cd rules-gen
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run locally:
   ```bash
   node bin/index.js
   ```

### Publishing to NPM

1. Update package.json with appropriate values
2. Login to NPM:
   ```bash
   npm login
   ```
3. Publish:
   ```bash
   npm publish
   ```

## License

MIT

## Team

Mike Endale
Naod Yeheyes