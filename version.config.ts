import fs from 'fs';
import { execSync } from 'child_process';

/**
 * Updates the version in package.json and src/version.ts
 */
function updateVersion() {
  // 1. Run npm version patch command
  execSync('npm version patch --no-git-tag-version', { stdio: 'inherit' });

  // 2. Get the version from package.json
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const newVersion = packageJson.version;

  // 3. Write the version to src/version.ts
  const versionContent = `export const VERSION = "${newVersion}"`;
  fs.writeFileSync('src/version.ts', versionContent);

  console.log(`Version updated to ${newVersion}`);
}

updateVersion();

