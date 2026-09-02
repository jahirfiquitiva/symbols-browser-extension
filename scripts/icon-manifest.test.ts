import * as os from 'node:os';
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

describe('generating a manifest from a broken release', () => {
  const writeUpstream = async (
    dir: string,
    iconDefinitions: Record<string, { iconPath: string }>,
    options: { omit?: 'languageIds' | 'rootFolderNames' } = {}
  ) => {
    await fs.outputJson(path.join(dir, 'package.json'), { version: '0.0.1' });
    await fs.outputFile(path.join(dir, 'src/icons/files/thing.svg'), '<svg/>');
    await fs.outputFile(
      path.join(dir, 'src/icons/folders/folder-open.svg'),
      '<svg/>'
    );

    const theme: Record<string, unknown> = {
      iconDefinitions,
      fileExtensions: { thing: 'thing', broken: 'nope' },
      fileNames: {},
      languageIds: {},
      folderNames: {},
      rootFolderNames: {},
      file: 'thing',
      folder: 'thing',
    };
    if (options.omit) delete theme[options.omit];

    await fs.outputJson(path.join(dir, 'src/symbol-icon-theme.json'), theme);
  };

  it('tolerates trailing whitespace in an icon path', async () => {
    // Upstream 0.0.24 shipped eight of these. They resolve in VS Code but would
    // 404 as extension URLs, and rejecting them loses real icons.
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'symbols-ws-'));
    await writeUpstream(dir, {
      thing: { iconPath: './icons/files/thing.svg ' },
    });

    const { manifest } = await buildIconManifest(dir);

    expect(manifest.icons.thing).toBe('icons/files/thing.svg');
    await fs.remove(dir);
  });

  it('falls back to the folder icon when a release defines no rootFolder', async () => {
    // 0.0.24 defines neither the key nor the map. Leaving rootFolder undefined
    // would put a name in the manifest that resolves to nothing.
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'symbols-root-'));
    await writeUpstream(
      dir,
      { thing: { iconPath: './icons/files/thing.svg' } },
      { omit: 'rootFolderNames' }
    );

    const { manifest } = await buildIconManifest(dir);

    expect(manifest.defaults.rootFolder).toBe('thing');
    expect(manifest.rootFolderNames).toEqual({});
    await fs.remove(dir);
  });

  it('tolerates a release that omits an association map', async () => {
    // Releases do not all define every map. 0.0.24 defines neither
    // rootFolderNames nor rootFolder, and rejecting a release over a map it
    // simply does not have would make it impossible to build, or to move off.
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'symbols-omit-'));
    await writeUpstream(
      dir,
      { thing: { iconPath: './icons/files/thing.svg' } },
      { omit: 'languageIds' }
    );

    const { manifest } = await buildIconManifest(dir);

    expect(manifest.languageIds).toEqual({});
    expect(manifest.fileExtensions.thing).toBe('thing');
    await fs.remove(dir);
  });

  it('drops an association pointing at an undeclared icon', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'symbols-drop-'));
    await writeUpstream(dir, {
      thing: { iconPath: './icons/files/thing.svg' },
    });

    const { manifest, dropped } = await buildIconManifest(dir);

    expect(manifest.fileExtensions).toEqual({ thing: 'thing' });
    expect(dropped).toEqual(['fileExtensions.broken -> nope']);
    await fs.remove(dir);
  });

  it('refuses to build when a declared icon has no file', async () => {
    // This one would ship rows with no icon at all, so it has to be fatal.
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'symbols-missing-'));
    await writeUpstream(dir, { thing: { iconPath: './icons/files/gone.svg' } });

    await expect(buildIconManifest(dir)).rejects.toThrow(/do not exist/);
    await fs.remove(dir);
  });
});
