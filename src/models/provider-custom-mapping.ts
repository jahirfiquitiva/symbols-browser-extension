/**
 * An escape hatch for icons that cannot be chosen from a file name alone.
 *
 * The lookup chain only sees a name, so it cannot tell `.github/workflows/ci.yml`
 * apart from any other yaml. A custom mapping inspects the surrounding DOM and,
 * when it matches, short-circuits the chain with an explicit icon name.
 */
export type ProviderCustomMapping = {
  match: (params: { row: HTMLElement; icon?: HTMLElement }) => boolean;
  /** Icon definition name, e.g. `github-actions`. */
  iconName: string;
};
