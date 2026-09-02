import * as path from 'node:path';
import * as fs from 'fs-extra';
import { describe, expect, it } from 'vitest';
import { buildIconManifest, upstreamDir } from './icon-manifest';

/**
 * Runs against the icon set currently pinned in package.json. These are the
 * tests that fail when that pin is bumped to a release that breaks something,
 * which is the only way this project can regress without anyone touching it.
 */
describe('icon manifest', () => {
  it('every icon points at a file that exists', async () => {
    const { manifest } = await buildIconManifest();
    const srcDir = path.join(upstreamDir, 'src');

    const missing: string[] = [];
    for (const [name, iconPath] of Object.entries(manifest.icons)) {
      if (!(await fs.pathExists(path.join(srcDir, iconPath)))) {
        missing.push(`${name} -> ${iconPath}`);
      }
    }

    expect(missing).toEqual([]);
  });

  it('every association points at a declared icon', async () => {
    const { manifest } = await buildIconManifest();
    const associations = [
      manifest.fileExtensions,
      manifest.fileNames,
      manifest.languageIds,
      manifest.folderNames,
      manifest.rootFolderNames,
    ];

    const unresolved = associations
      .flatMap((map) => Object.entries(map))
      .filter(([, iconName]) => !manifest.icons[iconName]);

    expect(unresolved).toEqual([]);
  });

  it('resolves every icon the extension falls back to', async () => {
    const { manifest } = await buildIconManifest();

    // These are hardcoded in the lookup chain, so a rename upstream would
    // silently leave rows with no icon at all.
    for (const iconName of [
      manifest.defaults.file,
      manifest.defaults.folder,
      manifest.defaults.folderOpen,
      manifest.defaults.rootFolder,
      'link',
      'github',
      'folder-github',
    ]) {
      expect(
        manifest.icons[iconName],
        `missing icon: ${iconName}`
      ).toBeTruthy();
    }
  });

  it('still covers the common languages', async () => {
    const { manifest } = await buildIconManifest();

    for (const extension of ['ts', 'tsx', 'js', 'json', 'md', 'css', 'html']) {
      expect(
        manifest.fileExtensions[extension],
        `missing extension: ${extension}`
      ).toBeTruthy();
    }
  });
});
