import { buildIconManifest } from './icon-manifest';
import { readPin } from './upstream';

/**
 * Shows what the pinned Symbols release actually offers.
 *
 * Needed whenever an icon name has to be written by hand, which is the case for
 * every provider custom mapping and every fallback in the lookup chain. Guessing
 * a name that upstream does not declare fails silently at runtime.
 *
 *   npm run icons:list             every icon
 *   npm run icons:list folder      only names containing "folder"
 *   npm run icons:list -- --unused icons no association points at
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const unusedOnly = args.includes('--unused');
  const filter = args.find((arg) => !arg.startsWith('--'))?.toLowerCase();

  const [pin, { manifest }] = await Promise.all([
    readPin(),
    buildIconManifest(),
  ]);

  const used = new Set(
    [
      manifest.fileExtensions,
      manifest.fileNames,
      manifest.languageIds,
      manifest.folderNames,
      manifest.rootFolderNames,
    ].flatMap((associations) => Object.values(associations))
  );

  const rows = Object.entries(manifest.icons)
    .filter(([name]) => !filter || name.toLowerCase().includes(filter))
    .filter(([name]) => !unusedOnly || !used.has(name))
    .sort(([a], [b]) => a.localeCompare(b));

  const width = Math.max(...rows.map(([name]) => name.length), 0);

  for (const [name, iconPath] of rows) {
    const marker = used.has(name) ? ' ' : '*';
    console.log(`${marker} ${name.padEnd(width)}  ${iconPath}`);
  }

  console.log(
    `\n${rows.length} of ${Object.keys(manifest.icons).length} icons in symbols@${pin}`
  );
  if (!unusedOnly) {
    console.log('* means no file or folder association resolves to it.');
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
