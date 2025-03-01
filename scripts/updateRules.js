#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { marked } = require('marked');

// Configuration for different rule sources
const SOURCES = {
  cursor: {
    url: 'https://raw.githubusercontent.com/PatrickJS/awesome-cursorrules/main/README.md',
    section: 'Frontend Frameworks and Libraries',
    outputFile: 'cursorRules.json'
  },
  windsurf: {
    // Add windsurf rules source when available
    url: null,
    section: null,
    outputFile: 'windsurfRules.json'
  }
};

async function fetchContent(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error(`Error fetching content from ${url}:`, error);
    return null;
  }
}

function extractSectionContent(markdown, sectionTitle) {
  const tokens = marked.lexer(markdown);
  let inSection = false;
  let items = [];

  for (const token of tokens) {
    if (token.type === 'heading' && token.text === sectionTitle) {
      inSection = true;
      continue;
    }
    
    if (inSection && token.type === 'heading') {
      break;
    }

    if (inSection && token.type === 'list') {
      items = token.items.map(item => {
        const matches = item.text.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (matches) {
          return {
            name: matches[1],
            url: matches[2],
            description: item.text.replace(matches[0], '').trim()
          };
        }
        return { name: item.text, url: null, description: '' };
      });
    }
  }

  return items;
}

async function processSource(type, source) {
  if (!source.url) {
    console.log(`Skipping ${type} rules - No source URL configured`);
    return null;
  }

  console.log(`Fetching ${type} rules from ${source.url}...`);
  const content = await fetchContent(source.url);
  if (!content) return null;

  const rules = extractSectionContent(content, source.section);
  return rules;
}

async function saveRules(rules, filename) {
  const filePath = path.join(__dirname, '..', 'data', filename);
  
  try {
    // Check if file exists and content is different
    let existingContent = null;
    try {
      existingContent = await fs.readFile(filePath, 'utf8');
    } catch (error) {
      // File doesn't exist yet, that's okay
    }

    const newContent = JSON.stringify(rules, null, 2);
    if (newContent !== existingContent) {
      await fs.writeFile(filePath, newContent);
      console.log(`Updated ${filename}`);
      return true;
    } else {
      console.log(`No changes needed for ${filename}`);
      return false;
    }
  } catch (error) {
    console.error(`Error saving ${filename}:`, error);
    return false;
  }
}

async function main() {
  let hasChanges = false;

  for (const [type, source] of Object.entries(SOURCES)) {
    const rules = await processSource(type, source);
    if (rules) {
      const changed = await saveRules(rules, source.outputFile);
      hasChanges = hasChanges || changed;
    }
  }

  // Exit with status code based on whether changes were made
  process.exit(hasChanges ? 0 : 1);
}

main();
