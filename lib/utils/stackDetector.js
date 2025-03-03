const fs = require('fs-extra');
const path = require('path');

const TECH_KEYWORDS = {
  // Core Technologies
  'javascript': ['javascript', 'js', 'node.js', 'nodejs', 'ecmascript'],
  'typescript': ['typescript', 'ts', '.tsx', 'type safety', 'type checking'],
  'node': ['node.js', 'nodejs', 'express', 'fastify', 'npm', 'package.json'],
  
  // Frontend Frameworks
  'next.js': ['next.js', 'nextjs', 'next router', 'next/router', 'app router'],
  'react': ['react', 'jsx', 'react component', 'usestate', 'useeffect'],
  'vue': ['vue', 'vue.js', 'vuejs', 'vue component', 'composition api'],
  'angular': ['angular', 'ng', 'angular component', 'novo elements'],
  'svelte': ['svelte', 'sveltekit'],
  'astro': ['astro'],
  'qwik': ['qwik'],
  'solid': ['solid.js', 'solidjs'],
  
  // CSS & Styling
  'tailwind': ['tailwind', 'tailwindcss', 'tailwind css'],
  'css': ['css', 'scss', 'sass', 'less', 'postcss'],
  
  // Testing & Tools
  'jest': ['jest', 'testing library'],
  'mocha': ['mocha', 'chai', 'test suite'],
  'eslint': ['eslint', 'linting', 'code style'],
  'prettier': ['prettier', 'code formatting'],
  
  // Backend & Other
  'python': ['python', 'django', 'flask'],
  'java': ['java', 'spring', 'springboot'],
  'go': ['golang', 'go lang', 'go fiber', 'servemux'],
  'elixir': ['elixir', 'phoenix'],
  'deno': ['deno']
};

async function analyzeProject(projectPath) {
  const analysis = {
    technologies: new Set(),
    dependencies: new Set(),
    devDependencies: new Set()
  };

  try {
    // Read package.json
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      
      // Add dependencies
      if (packageJson.dependencies) {
        Object.keys(packageJson.dependencies).forEach(dep => {
          analysis.dependencies.add(dep);
        });
      }
      
      // Add devDependencies
      if (packageJson.devDependencies) {
        Object.keys(packageJson.devDependencies).forEach(dep => {
          analysis.devDependencies.add(dep);
        });
      }

      // Check for specific technologies based on dependencies
      const allDeps = [...analysis.dependencies, ...analysis.devDependencies];
      Object.entries(TECH_KEYWORDS).forEach(([tech, keywords]) => {
        if (keywords.some(kw => allDeps.some(dep => dep.toLowerCase().includes(kw.toLowerCase())))) {
          analysis.technologies.add(tech);
        }
      });
    }

    return analysis;
  } catch (error) {
    console.error('Error analyzing project:', error);
    return analysis;
  }
}

function analyzeRuleContent(rule, projectTechs = new Set()) {
  const analysis = {
    technologies: new Set(),
    score: 0
  };

  // Helper function to check content for technology keywords
  function checkForTech(content, tech) {
    const lowerContent = content.toLowerCase();
    const matches = TECH_KEYWORDS[tech].filter(keyword => 
      lowerContent.includes(keyword.toLowerCase())
    );
    if (matches.length > 0) {
      analysis.technologies.add(tech);
      
      // Calculate score based on:
      // 1. Number of keyword matches
      // 2. Where the match was found (name vs content)
      // 3. Whether the technology is used in the project
      let matchScore = matches.length;
      if (content === rule.name.toLowerCase()) {
        matchScore *= 3; // Name matches weighted higher
      }
      if (projectTechs.has(tech)) {
        matchScore *= 2; // Double score for technologies used in project
      }
      analysis.score += matchScore;
    }
  }

  // Check rule name
  const ruleName = rule.name.toLowerCase();
  Object.keys(TECH_KEYWORDS).forEach(tech => checkForTech(ruleName, tech));

  // Check rule content
  if (rule.content) {
    const content = typeof rule.content === 'object' ? 
      JSON.stringify(rule.content) : rule.content;
    Object.keys(TECH_KEYWORDS).forEach(tech => checkForTech(content, tech));
  }

  return analysis;
}

async function getRelevantRules(rulesData, projectPath = process.cwd()) {
  // First analyze the project
  const projectAnalysis = await analyzeProject(projectPath);
  
  const matchedRules = [];
  const projectTechs = projectAnalysis.technologies;

  // Always include these core technologies for Node.js projects
  projectTechs.add('javascript');
  projectTechs.add('node');

  // Go through each category and its rules
  for (const [category, categoryData] of Object.entries(rulesData)) {
    if (!categoryData.rules) continue;

    // Check each rule in the category
    for (const rule of categoryData.rules) {
      // Analyze the rule's content, passing in project technologies
      const ruleAnalysis = analyzeRuleContent(rule, projectTechs);
      
      // Only include rules that match project technologies
      const hasMatchingTech = Array.from(ruleAnalysis.technologies)
        .some(tech => projectTechs.has(tech));
        
      if (hasMatchingTech) {
        matchedRules.push({
          category,
          rule,
          technologies: Array.from(ruleAnalysis.technologies),
          score: ruleAnalysis.score,
          projectMatch: Array.from(ruleAnalysis.technologies)
            .filter(tech => projectTechs.has(tech))
        });
      }
    }
  }

  // Sort by:
  // 1. Number of matching project technologies (desc)
  // 2. Overall relevance score (desc)
  matchedRules.sort((a, b) => {
    const projectMatchDiff = b.projectMatch.length - a.projectMatch.length;
    if (projectMatchDiff !== 0) return projectMatchDiff;
    return b.score - a.score;
  });

  return {
    projectTechnologies: Array.from(projectTechs),
    rules: matchedRules
  };
}

module.exports = {
  analyzeProject,
  getRelevantRules
};
