import { fetchIcons, readPin } from './upstream';

/**
 * Puts the pinned Symbols release in `vendor/`. Runs on install and before each
 * build, and does nothing when the right release is already there.
 */
async function main(): Promise<void> {
  const pin = await readPin();
  const force = process.argv.includes('--force');

  if (await fetchIcons(pin, { force })) {
    console.log(`Fetched symbols ${pin.tag} (${pin.commit.slice(0, 7)})`);
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
