import generated from '../generated/icon-manifest.json';
import type { SymbolsManifest } from '../models';

/**
 * The build step guarantees this file's shape, so the assertion is the single
 * point where generated JSON becomes typed. Import this rather than the JSON.
 */
export const symbolsManifest = generated as SymbolsManifest;
