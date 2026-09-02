import { buildIconManifest } from './icon-manifest';
import {
  diffManifests,
  fetchIcons,
  formatList,
  listReleases,
  type ManifestDiff,
  readPin,
  writePin,
} from './upstream';

/**
 * Moves the pinned Symbols release forward and reports what changed.
 *
 * The icon set is fetched rather than depended on, so updating is a change to
 * symbols.json. The value here is the report: without it an update is an opaque
 * jump from one tag to another, with nothing saying which icons appeared or
 * which file associations moved.
 *
 *   pnpm icons:check           does a newer release exist
 *   pnpm icons:update          move to the latest release
 *   pnpm icons:update 0.0.27   move to a specific release
 */
const printDiff = (diff: ManifestDiff): void => {
  const { added, removed } = diff.icons;

  console.log(`\nIcons  +${added.length}  -${removed.length}`);
  if (added.length > 0) console.log(`  added:   ${formatList(added)}`);
  if (removed.length > 0) console.log(`  removed: ${formatList(removed)}`);

  for (const [key, changes] of Object.entries(diff.associations)) {
    const total =
      changes.added.length + changes.removed.length + changes.changed.length;
    if (total === 0) continue;

    console.log(
      `\n${key}  +${changes.added.length}  -${changes.removed.length}  ~${changes.changed.length}`
    );
    if (changes.added.length > 0)
      console.log(`  added:   ${formatList(changes.added)}`);
    if (changes.removed.length > 0)
      console.log(`  removed: ${formatList(changes.removed)}`);
    if (changes.changed.length > 0)
      console.log(`  changed: ${formatList(changes.changed, 6)}`);
  }
};

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check');
  const requested = args.find((arg) => !arg.startsWith('--'));

  const pin = await readPin();
  const releases = listReleases(pin.repository);
  const latest = releases[releases.length - 1];
  const target = requested
    ? releases.find((release) => release.tag === requested)
    : latest;

  console.log(`pinned: ${pin.tag}\nlatest: ${latest.tag}`);

  if (!target) {
    throw new Error(
      `${requested} is not an upstream release. Known: ${releases
        .slice(-8)
        .map((release) => release.tag)
        .join(', ')}`
    );
  }

  if (target.commit === pin.commit) {
    console.log('\nAlready on that release.');
    return;
  }

  if (checkOnly) {
    console.log(`\nRun \`pnpm icons:update\` to move to ${latest.tag}.`);
    return;
  }

  // Best effort: a release that cannot produce a manifest is exactly the one
  // worth updating away from, so a failure here must not block the update. The
  // diff then reports the new release as entirely new, which is accurate.
  const before = await buildIconManifest()
    .then(({ manifest }) => manifest)
    .catch((error) => {
      console.warn(`\nCould not read the current release: ${error.message}`);
      return null;
    });

  console.log(`\nUpdating to ${target.tag}...`);

  const updated = { ...pin, tag: target.tag, commit: target.commit };
  await writePin(updated);
  await fetchIcons(updated);

  const { manifest: after, dropped } = await buildIconManifest();

  if (before) {
    printDiff(diffManifests(before, after));
  } else {
    console.log(`\n${Object.keys(after.icons).length} icons available.`);
  }

  if (dropped.length > 0) {
    console.log(
      `\n${dropped.length} association(s) point at icons upstream never declared and will be ignored:\n  ${dropped.join('\n  ')}`
    );
  }

  console.log('\nNow run `pnpm build && pnpm test`.');
}

main().catch((error) => {
  console.error(`\n${error.message ?? error}`);
  process.exit(1);
});
