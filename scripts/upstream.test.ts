import { describe, expect, it } from 'vitest';
import type { SymbolsManifest } from '../src/models/symbols-manifest';
import { compareVersions, diffManifests, formatList } from './upstream';

const manifest = (overrides: Partial<SymbolsManifest>): SymbolsManifest => ({
  upstreamVersion: '0.0.0',
  defaults: {
    file: 'document',
    folder: 'folder',
    folderOpen: 'folder-open',
  },
  icons: {},
  fileExtensions: {},
  fileNames: {},
  languageIds: {},
  folderNames: {},
  ...overrides,
});

describe('compareVersions', () => {
  it('orders by number rather than by string', () => {
    // A string sort puts 0.0.26 before 0.0.6, which would pin an update to an
    // older release than the one already installed.
    expect(['0.0.26', '0.0.6', '0.0.9'].sort(compareVersions)).toEqual([
      '0.0.6',
      '0.0.9',
      '0.0.26',
    ]);
  });

  it('treats missing segments as zero', () => {
    expect(compareVersions('1.0', '1.0.0')).toBe(0);
    expect(compareVersions('1.1', '1.0.9')).toBeGreaterThan(0);
  });
});

describe('diffManifests', () => {
  it('reports icons appearing and disappearing', () => {
    const diff = diffManifests(
      manifest({ icons: { keep: 'a.svg', gone: 'b.svg' } }),
      manifest({ icons: { keep: 'a.svg', fresh: 'c.svg' } })
    );

    expect(diff.icons.added).toEqual(['fresh']);
    expect(diff.icons.removed).toEqual(['gone']);
  });

  it('separates a changed association from an added one', () => {
    // An extension being repointed at a different icon is the change most
    // likely to go unnoticed, since the count of associations stays the same.
    const diff = diffManifests(
      manifest({ fileExtensions: { ts: 'typescript', old: 'gone' } }),
      manifest({ fileExtensions: { ts: 'typescript-react', new: 'fresh' } })
    );

    expect(diff.associations.fileExtensions).toEqual({
      added: ['new'],
      removed: ['old'],
      changed: ['ts: typescript -> typescript-react'],
    });
  });

  it('reports nothing when the manifests match', () => {
    const same = manifest({ icons: { a: 'a.svg' }, fileNames: { x: 'a' } });
    const diff = diffManifests(same, same);

    expect(diff.icons).toEqual({ added: [], removed: [] });
    expect(diff.associations.fileNames).toEqual({
      added: [],
      removed: [],
      changed: [],
    });
  });
});

describe('formatList', () => {
  it('truncates rather than printing hundreds of names', () => {
    expect(formatList(['a', 'b', 'c'], 2)).toBe('a, b and 1 more');
    expect(formatList(['a', 'b'], 2)).toBe('a, b');
  });
});
