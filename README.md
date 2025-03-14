https://github.com/user-attachments/assets/f1b800b8-5f6d-4168-a38c-51e51d609505

# Rules Generator CLI

An interactive CLI tool that generates cursor and windsurf rules based on user selections. 

## Features

- Interactive prompts for selecting rule types and specific rules
- Smart tech stack detection and rule matching
- Support for multiple rule selection in a single operation
- Generate for multiple IDE types simultaneously (Cursor/Windsurf)
- Smart filename generation with URL-friendly slugs
- Non-interactive mode for CI/CD or scripting
- Modern, user-friendly terminal UI with validation
- Proper error handling and user feedback
- Intelligent file size management with graceful truncation
- Streamlined file conflict resolution

## Installation

### Using npx
> Recommended - the rulelist gets updated daily

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
npx rules-gen
```

The interactive mode now supports:
- Multiple rule selection using checkboxes
- Multiple IDE type selection (Cursor/Windsurf/both)
- Smart tech stack detection for better rule matching
- Intelligent file handling:
  * Preview existing rules with rule count
  * Options to overwrite or append rules
  * Automatic size limit handling (100KB)
- Smart validation to ensure valid selections
- Clear breadcrumb navigation
- Improved search functionality

### Non-Interactive Mode

Use command-line arguments to generate rules without prompts:

```bash
# Generate specific cursor rules
npx rules-gen --type cursor --rules basic,hover --interactive false

# Generate all windsurf rules
npx rules-gen --type windsurf --interactive false

# Generate both cursor and windsurf rules
npx rules-gen --type all --interactive false

# Force overwrite existing files (skips conflict prompts)
npx rules-gen --type cursor --rules basic,hover --force

# Combine multiple options
npx rules-gen --type all --rules basic,react,node --force --interactive false
```

Options:
- `--type, -t`: Rule type (`cursor`, `windsurf`, or `all`)
- `--rules, -r`: Specific rules to generate (comma-separated)
- `--interactive, -i`: Use interactive prompts (`true`/`false`, defaults to `true`)
- `--force, -f`: Force overwrite existing files without prompting

## How It Works

The CLI generates IDE-specific rule files based on your selections:

- Cursor rules are generated as `.mdc` files in the `.cursor/rules/` directory
- Windsurf rules are generated as `.windsurfrules` files in markdown format
- File names are automatically generated as URL-friendly slugs
- Multiple rules can be generated simultaneously
- Both IDE types can be generated in a single operation
- Smart tech stack detection for better rule matching
- Automatic size limit handling (100KB) with graceful truncation

### File Handling

The CLI includes intelligent file handling features:

- Detects existing rule files and offers options to:
  * Overwrite existing rules
  * Append to existing rules
  * Cancel operation
- Shows condensed file previews for better decision making
- Handles large rule sets gracefully:
  * 100KB file size limit
  * Smart truncation with informative notes
  * Preserves existing content when near size limit

## Contributing

We're actively looking for additional rule sources! If you have a collection of rules or know of good sources, please:

1. Fork the repository
2. Add your rule source to `data/sources.json`
3. Create a pull request

Special thanks to [awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules) by [PatrickJS](https://github.com/PatrickJS) for providing the initial rule set.

## Development

### Prerequisites

- Node.js 18 or higher

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/blencorp/rules-gen.git
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

## Sponsorship

This project was sponsored by [BLEN](https://www.blencorp.com), a digital services company that provides Emerging Technology (ML/AI, RPA), Digital Modernization (moving legacy systems to Cloud) and Human-Centered Web/Mobile Design and Development. For questions, please contact [opensource@blencorp.com](mailto:opensource@blencorp.com).

## Team

- Mike Endale ([@mikeendale](https://x.com/mikeendale))
- Naod Yeheyes ([@naodya](https://x.com/naodya))
