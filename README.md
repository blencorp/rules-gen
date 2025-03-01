# Rules Generator CLI

An interactive CLI tool that generates cursor and windsurf rules based on user selections. 

## Features

- Interactive prompts for selecting rule types and specific rules
- Support for multiple rule selection in a single operation
- Generate for multiple IDE types simultaneously (Cursor/Windsurf)
- Smart filename generation with URL-friendly slugs
- Non-interactive mode for CI/CD or scripting
- Modern, user-friendly terminal UI with validation
- Proper error handling and user feedback

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

The interactive mode now supports:
- Multiple rule selection using checkboxes
- Multiple IDE type selection (Cursor/Windsurf/both)
- Smart validation to ensure valid selections
- Clear breadcrumb navigation
- Improved search functionality

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

The CLI generates IDE-specific rule files based on your selections:

- Cursor rules are generated as `.mdc` files in the `.cursor/rules/` directory
- Windsurf rules are generated as `.windsurfrules` files in markdown format
- File names are automatically generated as URL-friendly slugs
- Multiple rules can be generated simultaneously
- Both IDE types can be generated in a single operation

## Contributing

We're actively looking for additional rule sources! If you have a collection of rules or know of good sources, please:

1. Fork the repository
2. Add your rule source to `data/sources.json`
3. Create a pull request

Special thanks to [awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules) by [PatrickJS](https://github.com/PatrickJS) for providing the initial rule set.

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

## License

MIT

## Team

Mike Endale ([@mikeendale](https://x.com/mikeendale))

Naod Yeheyes ([@naodya](https://x.com/naodya))