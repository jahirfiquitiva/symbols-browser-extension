import { spawnSync } from 'node:child_process';
import * as path from 'node:path';
import * as fs from 'fs-extra';
import type { SymbolsManifest } from '../src/models/symbols-manifest';

export const UPSTREAM_REPO =
  'https://github.com/miguelsolorio/vscode-symbols.git';
export const DEPENDENCY_NAME = 'symbols';

const packageJsonPath = path.resolve(__dirname, '..', 'package.json');

type PackageJson = { dependencies: Record<string, string> };

/** The git ref the Symbols icon set is pinned to, e.g. `0.0.26`. */
export async function readPin(): Promise<string> {
  const pkg = (await fs.readJson(packageJsonPath)) as PackageJson;
  const spec = pkg.dependencies[DEPENDENCY_NAME] ?? '';
  const ref = spec.split('#')[1];

  if (!ref) {
    throw new Error(
      `Expected "${DEPENDENCY_NAME}" in package.json to pin a ref, got "${spec}"`
    );
  }

  return ref;
}

/**
 * Moves the pin and reinstalls, in that order, via npm itself.
 *
 * Editing package.json and then running a bare `npm install` does not work: the
 * lockfile already names a commit for this dependency, npm treats that as
 * satisfying the range, and node_modules silently keeps the old icon set while
 * package.json claims otherwise. Naming the spec on the command line forces
 * npm to re-resolve the ref and rewrite the lockfile.
 */
export function installPin(ref: string): boolean {
  const result = spawnSync(
    'npm',
    ['install', `github:miguelsolorio/vscode-symbols#${ref}`],
    { stdio: 'inherit' }
  );

  return result.status === 0;
}

/** Orders `0.0.6` before `0.0.26`, which a plain string sort gets backwards. */
export function compareVersions(a: string, b: string): number {
  const parse = (value: string) => value.split('.').map(Number);
  const [left, right] = [parse(a), parse(b)];

  for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0);
    if (diff !== 0) return diff;
  }

  return 0;
}

/** Upstream's release tags, oldest first. */
export function listUpstreamTags(): string[] {
  const result = spawnSync('git', ['ls-remote', '--tags', UPSTREAM_REPO], {
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(
      `Could not reach ${UPSTREAM_REPO}: ${result.stderr.trim()}`
    );
  }

  return result.stdout
    .split('\n')
    .map((line) => line.split('refs/tags/')[1])
    .filter((tag): tag is string => Boolean(tag) && !tag.endsWith('^{}'))
    .filter((tag) => /^\d+(\.\d+)*$/.test(tag))
    .sort(compareVersions);
}

export type ManifestDiff = {
  icons: { added: string[]; removed: string[] };
  associations: Record<
    string,
    { added: string[]; removed: string[]; changed: string[] }
  >;
};

const associationKeys = [
  'fileExtensions',
  'fileNames',
  'languageIds',
  'folderNames',
  'rootFolderNames',
] as const;

/** What changed between two generated manifests, for the update report. */
export function diffManifests(
  before: SymbolsManifest,
  after: SymbolsManifest
): ManifestDiff {
  const diff: ManifestDiff = {
    icons: {
      added: Object.keys(after.icons).filter((name) => !before.icons[name]),
      removed: Object.keys(before.icons).filter((name) => !after.icons[name]),
    },
    associations: {},
  };

  for (const key of associationKeys) {
    diff.associations[key] = {
      added: Object.keys(after[key]).filter((name) => !before[key][name]),
      removed: Object.keys(before[key]).filter((name) => !after[key][name]),
      changed: Object.keys(after[key])
        .filter(
          (name) => before[key][name] && before[key][name] !== after[key][name]
        )
        .map((name) => `${name}: ${before[key][name]} -> ${after[key][name]}`),
    };
  }

  return diff;
}

/** Prints at most `limit` entries, then says how many were left out. */
export function formatList(items: string[], limit = 12): string {
  if (items.length <= limit) return items.join(', ');

  return `${items.slice(0, limit).join(', ')} and ${items.length - limit} more`;
}
