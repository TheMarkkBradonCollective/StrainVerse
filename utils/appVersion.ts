/** App version shown on loading screen and in update tooling. */
export const APP_VERSION =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.1.0';

export const APP_NAME = 'StrainVerse';

export function formatAppVersion(prefix = 'v'): string {
  return `${prefix}${APP_VERSION}`;
}
