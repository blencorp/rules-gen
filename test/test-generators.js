const cursorGenerator = require('../lib/generators/cursor');
const windsurfGenerator = require('../lib/generators/windsurf');
const path = require('path');

async function testGenerators() {
  const testRule = {
    name: "Test Rule",
    content: {
      description: "A test rule for development",
      patterns: ["src/**/*.js", "lib/**/*.ts"],
      rules: [
        "Use TypeScript for all new code",
        "Follow the project's coding standards",
        "Write comprehensive tests",
        "Document all public APIs",
        "Use early returns when possible",
        "Keep functions small and focused",
        "Use proper error handling",
        "Follow best practices for performance",
        "Maintain consistent code style",
        "Use dependency injection"
      ]
    }
  };

  // Test Cursor Generator
  console.log("Testing Cursor Generator...");
  try {
    const cursorResult = await cursorGenerator.generate(testRule, process.cwd(), true); // Add force=true
    console.log("Cursor Generator Result:", cursorResult);
  } catch (error) {
    console.error("Cursor Generator Error:", error);
  }

  // Test Windsurf Generator
  console.log("\nTesting Windsurf Generator...");
  try {
    const windsurfResult = await windsurfGenerator.generate(testRule, process.cwd(), true); // Add force=true
    console.log("Windsurf Generator Result:", windsurfResult);
  } catch (error) {
    console.error("Windsurf Generator Error:", error);
  }
}

testGenerators().catch(console.error);
