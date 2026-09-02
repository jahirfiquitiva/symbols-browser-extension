import { spawnSync } from 'node:child_process';
import * as path from 'node:path';
import * as fs from 'fs-extra';

/**
 * Wraps the built extension in an Xcode project, which is the only shape Safari
 * accepts. This produces a project, not an installable app: building, signing
 * and enabling it in Safari are manual steps in Xcode. See README.md.
 */
const root = path.resolve(__dirname, '..');
const extensionDir = path.join(root, 'dist', 'safari');
const projectDir = path.join(root, 'safari');

async function main(): Promise<void> {
  if (!(await fs.pathExists(path.join(extensionDir, 'manifest.json')))) {
    throw new Error('dist/safari is missing. Run `npm run build` first.');
  }

  if (process.platform !== 'darwin') {
    throw new Error('Safari packaging requires macOS with Xcode installed.');
  }

  await fs.ensureDir(projectDir);

  const result = spawnSync(
    'xcrun',
    [
      'safari-web-extension-converter',
      extensionDir,
      '--project-location',
      projectDir,
      '--app-name',
      'Symbols Icons',
      '--bundle-identifier',
      'com.jahirfiquitiva.symbols-icons',
      '--swift',
      '--no-open',
      '--force',
    ],
    { stdio: 'inherit' }
  );

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `safari-web-extension-converter exited with ${result.status}`
    );
  }

  console.log(`\nXcode project written to ${path.relative(root, projectDir)}`);
  console.log('Open it in Xcode, set your signing team, then build and run.');
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
