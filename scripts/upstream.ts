import { spawnSync } from 'node:child_process';
import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'fs-extra';
import type { SymbolsManifest } from '../src/models/symbols-manifest';

const root = path.resolve(__dirname, '..');
const pinPath = path.join(root, 'symbols.json');

/** Where the fetched icon set lands. Gitignored; never committed. */
export const upstreamDir = path.join(root, 'vendor', 'symbols');

const commitMarker = path.join(upstreamDir, '.commit');

/**
 * The Symbols release this project is built against.
 *
 * The icon set is content, not code, so it is fetched rather than installed as
 * a dependency. Package managers insist on running a git-hosted package's build
 * scripts, and upstream's `prepare` would pull in its own toolchain to build a
 * VS Code extension we never use. Fetching sidesteps that, keeps installs free
 * of upstream code execution, and makes this work the same under npm, pnpm,
 * yarn or bun.
 *
 * The tag is what a human bumps. The commit is what is actually downloaded,
 * because a tag can be moved and a commit cannot.
 */
export type Pin = {
  repository: string;
  tag: string;
  commit: string;
};

export const readPin = (): Promise<Pin> => fs.readJson(pinPath) as Promise<Pin>;

export const writePin = (pin: Pin): Promise<void> =>
  fs.writeJson(pinPath, pin, { spaces: 2 });

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

export type Release = { tag: string; commit: string };

/** Upstream's releases, oldest first. */
export function listReleases(repository: string): Release[] {
  const result = spawnSync(
    'git',
    ['ls-remote', '--tags', `https://github.com/${repository}.git`],
    { encoding: 'utf8' }
  );

  if (result.status !== 0) {
    throw new Error(`Could not reach ${repository}: ${result.stderr.trim()}`);
  }

  return result.stdout
    .split('\n')
    .flatMap((line) => {
      const [commit, ref] = line.split('\t');
      const tag = ref?.split('refs/tags/')[1];

      // `^{}` refs point at the commit a tag object wraps. Plain tags here.
      if (!tag || tag.endsWith('^{}') || !/^\d+(\.\d+)*$/.test(tag)) return [];

      return [{ tag, commit }];
    })
    .sort((a, b) => compareVersions(a.tag, b.tag));
}

/**
 * Downloads a release and extracts the icons and theme file into `vendor/`.
 *
 * A marker records which commit is on disk so repeat runs cost nothing, which
 * matters because this runs on install and before every build.
 */
export async function fetchIcons(
  pin: Pin,
  { force = false } = {}
): Promise<boolean> {
  const onDisk = await fs.readFile(commitMarker, 'utf8').catch(() => null);
  if (!force && onDisk?.trim() === pin.commit) return false;

  const url = `https://codeload.github.com/${pin.repository}/tar.gz/${pin.commit}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `${url} returned ${response.status} ${response.statusText}`
    );
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'symbols-fetch-'));
  const tarball = path.join(tempDir, 'release.tar.gz');
  await fs.writeFile(tarball, Buffer.from(await response.arrayBuffer()));

  await fs.emptyDir(upstreamDir);

  // Only the icons and the theme file are wanted, not upstream's whole repo.
  // The members are named exactly rather than by pattern, since GNU tar needs
  // an extra flag for wildcards and BSD tar does not.
  const prefix = `${pin.repository.split('/')[1]}-${pin.commit}`;
  const extract = spawnSync(
    'tar',
    [
      '-xzf',
      tarball,
      '-C',
      upstreamDir,
      '--strip-components=1',
      `${prefix}/src/icons`,
      `${prefix}/src/symbol-icon-theme.json`,
      `${prefix}/package.json`,
      `${prefix}/LICENSE`,
    ],
    { stdio: 'inherit' }
  );

  await fs.remove(tempDir);

  if (extract.status !== 0) {
    throw new Error(`Could not extract ${url}`);
  }

  await fs.writeFile(commitMarker, pin.commit);

  return true;
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
