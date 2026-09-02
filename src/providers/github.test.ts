import { beforeEach, describe, expect, it } from 'vitest';
import { EXTENSION_ATTRIBUTE, ICON_NAME_ATTRIBUTE } from '../lib/constants';
import github from './github';

const provider = github();

const createIcon = (iconName: string) => {
  const icon = document.createElement('img');
  icon.setAttribute('src', `chrome-extension://id/${iconName}.svg`);
  icon.setAttribute(ICON_NAME_ATTRIBUTE, iconName);

  return icon;
};

describe('github provider', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('replaceIcon', () => {
    it('keeps the original svg in the DOM', () => {
      // Removing it crashes GitHub's React tree view, so the element has to
      // survive and only its contents may change.
      document.body.innerHTML =
        '<svg class="octicon octicon-file"><path /></svg>';
      const svgEl = document.querySelector('svg') as unknown as HTMLElement;

      provider.replaceIcon(svgEl, createIcon('typescript'));

      expect(document.querySelector('svg')).toBe(svgEl);
      expect(svgEl.querySelector('path')).toBeNull();
      expect(svgEl.style.backgroundImage).toBe(
        'url("chrome-extension://id/typescript.svg")'
      );
      expect(svgEl.getAttribute(EXTENSION_ATTRIBUTE)).toBe('icon');
    });

    it('moves a meaningful text colour onto the adjacent link', () => {
      // The svg no longer renders a glyph, so the colour that signalled an
      // added or removed file has to move somewhere still visible.
      document.body.innerHTML = `
        <div class="row">
          <div><svg class="octicon fgColor-success"></svg></div>
          <div><a href="#">file.ts</a></div>
        </div>`;
      const svgEl = document.querySelector('svg') as unknown as HTMLElement;

      provider.replaceIcon(svgEl, createIcon('typescript'));

      expect(
        document.querySelector('a')?.classList.contains('fgColor-success')
      ).toBe(true);
    });

    it('does not move the default text colour', () => {
      document.body.innerHTML = `
        <div class="row">
          <div><svg class="octicon fgColor-muted"></svg></div>
          <div><a href="#">file.ts</a></div>
        </div>`;
      const svgEl = document.querySelector('svg') as unknown as HTMLElement;

      provider.replaceIcon(svgEl, createIcon('typescript'));

      expect(
        document.querySelector('a')?.classList.contains('fgColor-muted')
      ).toBe(false);
    });
  });

  describe('transformFileName', () => {
    const transform = (fileName: string, className = '') => {
      const row = document.createElement('div');
      if (className) row.className = className;

      return provider.transformFileName(
        row,
        document.createElement('span'),
        fileName
      );
    };

    it('strips the commit sha from a submodule', () => {
      expect(transform('my-module @ a1b2c3d')).toBe('my-module');
    });

    it('turns a release asset into something resolvable', () => {
      expect(transform('Source code (zip)', 'Box-row')).toBe('Source code.zip');
    });

    it('leaves an ordinary name alone', () => {
      expect(transform('index.ts')).toBe('index.ts');
    });
  });

  describe('customMappings', () => {
    const matchedIcon = (html: string) => {
      document.body.innerHTML = html;
      const row = document.querySelector('.row') as HTMLElement;

      return provider.customMappings?.find((mapping) => mapping.match({ row }))
        ?.iconName;
    };

    it('matches the workflows folder in a file listing', () => {
      expect(
        matchedIcon(
          '<div class="row"><a href="/u/r/tree/main/.github/workflows">workflows</a></div>'
        )
      ).toBe('folder-github');
    });

    it('matches a workflow file in a file listing', () => {
      expect(
        matchedIcon(
          '<div class="row"><a href="/u/r/blob/main/.github/workflows/ci.yml">ci.yml</a></div>'
        )
      ).toBe('github');
    });

    it('matches a workflow file in the tree view', () => {
      expect(
        matchedIcon(`
          <li class="PRIVATE_TreeView-item" id=".github/workflows/ci.yaml-item">
            <div class="row"><a href="#">ci.yaml</a></div>
          </li>`)
      ).toBe('github');
    });

    it('does not match an unrelated yaml file', () => {
      expect(
        matchedIcon(
          '<div class="row"><a href="/u/r/blob/main/config/app.yml">app.yml</a></div>'
        )
      ).toBeUndefined();
    });
  });
});
