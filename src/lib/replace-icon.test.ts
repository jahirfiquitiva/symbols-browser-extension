import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('webextension-polyfill', () => ({
  default: {
    runtime: {
      getURL: (resource: string) => `chrome-extension://id/${resource}`,
    },
  },
}));

const { ICON_NAME_ATTRIBUTE } = await import('./constants');
const { replaceIconInRow } = await import('./replace-icon');
const { swapIcon } = await import('../providers/shared');

type Provider = import('../models').Provider;
type SymbolsManifest = import('../models').SymbolsManifest;

const manifest: SymbolsManifest = {
  upstreamVersion: 'test',
  defaults: {
    file: 'document',
    folder: 'folder',
    folderOpen: 'folder-open',
    rootFolder: 'folder-gray',
  },
  icons: {
    document: 'icons/files/document.svg',
    'folder-gray': 'icons/folders/folder-gray.svg',
    folder: 'icons/folders/folder.svg',
    'folder-open': 'icons/folders/folder-open.svg',
    'folder-github': 'icons/folders/folder-github.svg',
    link: 'icons/files/link.svg',
    typescript: 'icons/files/typescript.svg',
    compressed: 'icons/files/compressed.svg',
    gzip: 'icons/files/gzip.svg',
    yaml: 'icons/files/yaml.svg',
    readme: 'icons/files/readme.svg',
    github: 'icons/files/github.svg',
  },
  fileExtensions: {
    ts: 'typescript',
    gz: 'gzip',
    'tar.gz': 'compressed',
  },
  fileNames: { 'readme.md': 'readme' },
  languageIds: { yaml: 'yaml' },
  folderNames: { '.github': 'folder-github' },
  rootFolderNames: { 'my-repo': 'folder-github' },
};

const createProvider = (overrides: Partial<Provider> = {}): Provider => ({
  name: 'test',
  domains: [{ host: 'test.com', test: /^test\.com$/ }],
  selectors: { row: '.row', filename: '.filename', icon: '.icon' },
  onAdd: () => {},
  getIsDirectory: () => false,
  getIsSubmodule: () => false,
  getIsSymlink: () => false,
  replaceIcon: swapIcon,
  transformFileName: (_row, _icon, fileName) => fileName,
  ...overrides,
});

const renderRow = (fileName: string): HTMLElement => {
  document.body.innerHTML = `
    <div class="row">
      <span class="filename">${fileName}</span>
      <svg class="icon"></svg>
    </div>`;

  return document.querySelector('.row') as HTMLElement;
};

/** The icon name the row ended up with, or null if nothing was replaced. */
const resolve = (fileName: string, overrides: Partial<Provider> = {}) => {
  const row = renderRow(fileName);
  replaceIconInRow(row, createProvider(overrides), manifest);

  return row.querySelector('img')?.getAttribute(ICON_NAME_ATTRIBUTE) ?? null;
};

describe('icon lookup', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('files', () => {
    it('matches a known extension', () => {
      expect(resolve('index.ts')).toBe('typescript');
    });

    it('prefers the longest matching extension', () => {
      // Both `tar.gz` and `gz` match; the more specific one has to win or every
      // tarball renders as a plain gzip file.
      expect(resolve('archive.tar.gz')).toBe('compressed');
      expect(resolve('archive.gz')).toBe('gzip');
    });

    it('prefers an exact file name over its extension', () => {
      expect(resolve('readme.md')).toBe('readme');
    });

    it('falls back to a lowercased file name', () => {
      expect(resolve('README.md')).toBe('readme');
    });

    it('falls back to a language id when no extension matches', () => {
      expect(resolve('docker-compose.yaml')).toBe('yaml');
    });

    it('falls back to the default file icon', () => {
      expect(resolve('mystery.unknown')).toBe('document');
    });

    it('ignores an extension on an implausibly long name', () => {
      expect(resolve(`${'a'.repeat(300)}.ts`)).toBe('document');
    });
  });

  describe('folders', () => {
    const asFolder = { getIsDirectory: () => true };

    it('matches a known folder name', () => {
      expect(resolve('.github', asFolder)).toBe('folder-github');
    });

    it('falls back to the default folder icon', () => {
      expect(resolve('whatever', asFolder)).toBe('folder');
    });

    it('opens a plain folder when it is expanded', () => {
      expect(
        resolve('whatever', { ...asFolder, getIsExpanded: () => true })
      ).toBe('folder-open');
    });

    it('uses the root icon for a row standing for the repository itself', () => {
      // No provider implements getIsRoot today. This covers the wiring so that
      // adding one is a provider change and nothing else.
      expect(resolve('anything', { ...asFolder, getIsRoot: () => true })).toBe(
        'folder-gray'
      );
    });

    it('matches a named root folder', () => {
      expect(resolve('my-repo', { ...asFolder, getIsRoot: () => true })).toBe(
        'folder-github'
      );
    });

    it('keeps a named folder icon when it is expanded', () => {
      // Symbols has no per-folder open variants, so swapping here would lose
      // the more informative icon.
      expect(
        resolve('.github', { ...asFolder, getIsExpanded: () => true })
      ).toBe('folder-github');
    });
  });

  describe('special entries', () => {
    it('uses a folder for submodules', () => {
      expect(resolve('vendor', { getIsSubmodule: () => true })).toBe('folder');
    });

    it('uses a link for symlinks', () => {
      expect(resolve('shortcut', { getIsSymlink: () => true })).toBe('link');
    });

    it('lets a custom mapping override the chain', () => {
      expect(
        resolve('ci.ts', {
          customMappings: [{ match: () => true, iconName: 'github' }],
        })
      ).toBe('github');
    });
  });

  describe('reading the name from the DOM', () => {
    it('uses only the last path segment', () => {
      expect(resolve('src/lib/index.ts')).toBe('typescript');
    });

    it('collapses whitespace introduced by markup', () => {
      expect(resolve('\n      index.ts\n    ')).toBe('typescript');
    });

    it('applies the provider transform before matching', () => {
      expect(
        resolve('vendor @ a1b2c3d4', {
          transformFileName: (_row, _icon, name) =>
            name.replace(/\s+@\s+[a-fA-F0-9]{4,}$/, '.ts'),
        })
      ).toBe('typescript');
    });

    it('does nothing when the row has no name', () => {
      document.body.innerHTML =
        '<div class="row"><svg class="icon"></svg></div>';
      const row = document.querySelector('.row') as HTMLElement;

      replaceIconInRow(row, createProvider(), manifest);

      expect(row.querySelector('img')).toBeNull();
    });

    it('does not replace an icon twice', () => {
      const row = renderRow('index.ts');
      const provider = createProvider();

      replaceIconInRow(row, provider, manifest);
      const first = row.querySelector('img');
      replaceIconInRow(row, provider, manifest);

      expect(row.querySelectorAll('img')).toHaveLength(1);
      expect(row.querySelector('img')).toBe(first);
    });
  });

  it('leaves the row alone when the icon has no file behind it', () => {
    const row = renderRow('index.ts');
    const brokenManifest: SymbolsManifest = {
      ...manifest,
      icons: {},
    };

    replaceIconInRow(row, createProvider(), brokenManifest);

    expect(row.querySelector('img')).toBeNull();
    expect(row.querySelector('svg')).not.toBeNull();
  });
});
