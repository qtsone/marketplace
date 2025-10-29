#!/usr/bin/env node

/**
 * Update version in all plugin.json and marketplace.json files
 * Usage: node update-versions.js <version>
 */

const fs = require("fs");
const path = require("path");

const newVersion = process.argv[2];

if (!newVersion) {
  console.error("Error: Version argument required");
  console.error("Usage: node update-versions.js <version>");
  process.exit(1);
}

// Validate semantic version format
if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
  console.error(`Error: Invalid version format: ${newVersion}`);
  console.error("Expected format: X.Y.Z (e.g., 1.2.3)");
  process.exit(1);
}

console.log(`\n📦 Updating versions to ${newVersion}\n`);

let filesUpdated = 0;
let errors = 0;

/**
 * Recursively find files matching a pattern
 */
function findFiles(dir, pattern, results = []) {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory()) {
      // Skip node_modules but allow .claude-plugin
      if (
        file.name !== "node_modules" &&
        (file.name === ".claude-plugin" || !file.name.startsWith("."))
      ) {
        findFiles(fullPath, pattern, results);
      }
    } else if (file.name === pattern) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Update version in a JSON file
 */
function updateVersion(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const json = JSON.parse(content);

    if (json.version !== newVersion) {
      console.log(
        `✓ ${path.relative(process.cwd(), filePath)}: ${json.version} → ${newVersion}`,
      );
      json.version = newVersion;
      fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + "\n", "utf8");
      filesUpdated++;
    } else {
      console.log(
        `  ${path.relative(process.cwd(), filePath)}: already ${newVersion}`,
      );
    }
  } catch (error) {
    console.error(
      `✗ ${path.relative(process.cwd(), filePath)}: ${error.message}`,
    );
    errors++;
  }
}

/**
 * Update marketplace.json with unified versioning
 * Updates both top-level version and all plugin versions
 */
function updateMarketplaceFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const json = JSON.parse(content);
    let updated = false;

    // Update top-level version
    if (json.version !== newVersion) {
      console.log(
        `✓ ${path.relative(process.cwd(), filePath)} (marketplace): ${json.version} → ${newVersion}`,
      );
      json.version = newVersion;
      updated = true;
    } else {
      console.log(
        `  ${path.relative(process.cwd(), filePath)} (marketplace): already ${newVersion}`,
      );
    }

    // Update all plugin versions in plugins array
    if (json.plugins && Array.isArray(json.plugins)) {
      json.plugins.forEach((plugin) => {
        if (plugin.version !== newVersion) {
          console.log(
            `✓ ${path.relative(process.cwd(), filePath)} (plugin: ${plugin.name}): ${plugin.version || "none"} → ${newVersion}`,
          );
          plugin.version = newVersion;
          updated = true;
        } else {
          console.log(
            `  ${path.relative(process.cwd(), filePath)} (plugin: ${plugin.name}): already ${newVersion}`,
          );
        }
      });
    }

    if (updated) {
      fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + "\n", "utf8");
      filesUpdated++;
    }
  } catch (error) {
    console.error(
      `✗ ${path.relative(process.cwd(), filePath)}: ${error.message}`,
    );
    errors++;
  }
}

// Update marketplace.json (both top-level version and plugin versions)
const marketplaceFile = path.join(
  process.cwd(),
  ".claude-plugin",
  "marketplace.json",
);
if (fs.existsSync(marketplaceFile)) {
  updateMarketplaceFile(marketplaceFile);
}

// Find and update all plugin.json files in plugins/
const pluginsDir = path.join(process.cwd(), "plugins");
if (fs.existsSync(pluginsDir)) {
  const pluginFiles = findFiles(pluginsDir, "plugin.json");
  pluginFiles.forEach(updateVersion);
}

console.log(`\n${filesUpdated} file(s) updated`);

if (errors > 0) {
  console.error(`\n⚠️  ${errors} error(s) occurred`);
  process.exit(1);
}

console.log("\n✅ Version update complete\n");
