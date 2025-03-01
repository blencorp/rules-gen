#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { marked } = require('marked');
const yaml = require('js-yaml');

// Configuration for different rule sources
const SOURCES = {
  cursor: {
    url: 'https://raw.githubusercontent.com/PatrickJS/awesome-cursorrules/main/README.md',
    section: 'Frontend Frameworks and Libraries',
    outputFile: 'cursorRules.json'
  }
};

// Maximum retries for failed requests
const MAX_RETRIES = 3;
// Delay between retries in ms
const RETRY_DELAY = 2000;
// Delay between rule fetches to avoid rate limiting
const RATE_LIMIT_DELAY = 1000;

function convertToRawUrl(relativeUrl) {
  const baseUrl = 'https://raw.githubusercontent.com/PatrickJS/awesome-cursorrules/refs/heads/main/';
  return baseUrl + relativeUrl.replace(/^\.\//,'');
}

async function fetchWithRetry(url, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return await response.text();
      }
      if (response.status === 404) {
        console.warn(`Resource not found at ${url}`);
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    } catch (error) {
      if (i === retries - 1) throw error;
      console.warn(`Retry ${i + 1}/${retries} for ${url}`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
  return null;
}

async function parseRuleContent(content) {
  if (!content) return { rules: [], patterns: [], files: [] };

  try {
    // Try to parse as YAML first
    const parsed = yaml.load(content);
    if (parsed) {
      return {
        rules: Array.isArray(parsed) ? parsed : [parsed],
        patterns: parsed.patterns || [],
        files: parsed.files || []
      };
    }
  } catch {
    // If YAML parsing fails, treat as plain text rules
    const rules = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
    
    return {
      rules,
      patterns: [],
      files: []
    };
  }
}

async function fetchRuleContent(url) {
  await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
  console.log(`Fetching rule content from ${url}...`);
  
  try {
    const content = await fetchWithRetry(url);
    if (!content) return null;
    
    return await parseRuleContent(content);
  } catch (error) {
    console.error(`Error processing rule from ${url}:`, error);
    return null;
  }
}

async function extractSectionContent(markdown, sectionTitle) {
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
      items = await Promise.all(token.items.map(async item => {
        const matches = item.text.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (matches) {
          const name = matches[1];
          const relativeUrl = matches[2];
          const rawUrl = convertToRawUrl(relativeUrl);
          
          console.log(`Processing rule: ${name}`);
          const ruleContent = await fetchRuleContent(rawUrl);
          
          if (!ruleContent) {
            console.warn(`Warning: No valid rule content found for ${name}`);
            return null;
          }

          return {
            name,
            url: relativeUrl,
            rawUrl,
            description: item.text.replace(matches[0], '').trim(),
            content: ruleContent
          };
        }
        return null;
      }));
    }
  }

  return items.filter(item => item !== null);
}

async function processSource(type, source) {
  if (!source.url) {
    console.log(`Skipping ${type} rules - No source URL configured`);
    return null;
  }

  console.log(`Fetching ${type} rules from ${source.url}...`);
  try {
    const content = await fetchWithRetry(source.url);
    if (!content) return null;

    const rules = await extractSectionContent(content, source.section);
    return rules;
  } catch (error) {
    console.error(`Error processing ${type} rules:`, error);
    return null;
  }
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

main()
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
