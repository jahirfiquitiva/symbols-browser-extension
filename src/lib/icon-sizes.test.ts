import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = {
  get: vi.fn(),
  onChanged: { addListener: vi.fn() },
};

vi.mock('webextension-polyfill', () => ({
  default: { storage: { sync: storage, onChanged: storage.onChanged } },
}));

const { ICON_SIZE_ATTRIBUTE } = await import('./constants');
const { initIconSizes } = await import('./icon-sizes');

describe('initIconSizes', () => {
  beforeEach(() => {
    document.body.removeAttribute(ICON_SIZE_ATTRIBUTE);
    storage.get.mockReset();
    storage.get.mockResolvedValue({ 'localhost:iconSize': 'lg' });
  });

  it('applies the size when the document has already loaded', async () => {
    // The content script awaits its settings before this runs, by which point
    // DOMContentLoaded may have fired and will never fire again. Waiting for it
    // would leave every icon stuck at the default size.
    expect(document.readyState).not.toBe('loading');

    initIconSizes();
    await vi.waitFor(() =>
      expect(document.body.getAttribute(ICON_SIZE_ATTRIBUTE)).toBe('lg')
    );
  });
});
