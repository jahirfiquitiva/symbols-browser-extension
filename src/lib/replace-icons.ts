import { observe } from 'selector-observer';
import type { Provider, SymbolsManifest } from '../models';
import { replaceIconInRow } from './replace-icon';

/**
 * Watches for file rows appearing and swaps their icons.
 *
 * `selector-observer` covers rows entering the DOM. It does not cover a site
 * re-rendering a row it already owns, which is what happens on SPA navigation
 * and folder expansion, so each provider layers its own observer via `onAdd`.
 */
export const observePage = (
  provider: Provider,
  manifest: SymbolsManifest
): void => {
  observe(provider.selectors.row, {
    add(row) {
      const replace = () =>
        replaceIconInRow(row as HTMLElement, provider, manifest);

      replace();
      provider.onAdd(row as HTMLElement, replace);
    },
  });
};
