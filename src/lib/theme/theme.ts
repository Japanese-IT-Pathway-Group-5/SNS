export const THEME_COOKIE = 'claymore_theme';
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
export const THEME_PLACEHOLDER = '%claymore.theme%';
export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const;

export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export function isThemePreference(value: unknown): value is ThemePreference {
	return THEME_PREFERENCES.some((preference) => preference === value);
}

/** Non-sensitive device preference, validated before it reaches server-rendered markup. */
export function parseThemePreference(value: unknown): ThemePreference {
	return isThemePreference(value) ? value : 'system';
}

export function applyThemeToHtml(html: string, theme: ThemePreference): string {
	return html.replace(THEME_PLACEHOLDER, theme);
}
