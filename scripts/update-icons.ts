import { buildIconManifest } from './icon-manifest';
import {
  diffManifests,
  formatList,
  installPin,
  listUpstreamTags,
  type ManifestDiff,
  readPin,
} from './upstream';

/**
 * Moves the pinned Symbols release forward and reports what changed.
 *
 * The icon set is a dependency rather than a fork, so updating it is a one-line
 * change. The value here is the report: without it an update is an opaque jump
 * from one tag to another, and nothing says which icons appeared or which file
 * associations moved.
 *
 *   npm run icons:check        does a newer release exist
 *   npm run icons:update       move to the latest release
 *   npm run icons:update 0.0.27  move to a specific release
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

  const current = await readPin();
  const tags = listUpstreamTags();
  const latest = tags[tags.length - 1];
  const target = requested ?? latest;

  console.log(`pinned: ${current}\nlatest: ${latest}`);

  if (requested && !tags.includes(requested)) {
    throw new Error(
      `${requested} is not an upstream release. Known: ${tags.slice(-8).join(', ')}`
    );
  }

  if (target === current) {
    console.log('\nAlready on that release.');
    return;
  }

  if (checkOnly) {
    console.log(`\nRun \`npm run icons:update\` to move to ${latest}.`);
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

  console.log(`\nUpdating to ${target}...`);

  if (!installPin(target)) {
    // Leaving a pin that was never installed would make the next build lie
    // about which release it came from.
    installPin(current);
    throw new Error(`npm install failed, reverted the pin to ${current}`);
  }

  const installed = await readPin();
  if (installed !== target) {
    throw new Error(
      `npm reports ${installed} after installing ${target}. The pin and node_modules may disagree.`
    );
  }

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

  console.log('\nNow run `npm run build && npm test`.');
}

main().catch((error) => {
  console.error(`\n${error.message ?? error}`);
  process.exit(1);
});
