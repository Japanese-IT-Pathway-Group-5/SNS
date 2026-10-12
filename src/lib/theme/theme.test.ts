import { describe, expect, it } from 'vitest';
import { applyThemeToHtml, parseThemePreference, THEME_PLACEHOLDER } from './theme';

describe('parseThemePreference', () => {
	it.each(['system', 'light', 'dark'] as const)('accepts %s', (value) => {
		expect(parseThemePreference(value)).toBe(value);
	});

	it.each([
		undefined,
		null,
		'',
		'Dark',
		'dark ',
		' light',
		'auto',
		'dark"><script>alert(1)</script>',
		'light dark',
		0,
		['dark']
	])('falls back to system for %j', (value) => {
		expect(parseThemePreference(value)).toBe('system');
	});
});

describe('applyThemeToHtml', () => {
	it('fills the theme placeholder on the html element', () => {
		const html = `<html lang="en" data-theme="${THEME_PLACEHOLDER}"><head></head>`;
		expect(applyThemeToHtml(html, 'dark')).toBe('<html lang="en" data-theme="dark"><head></head>');
	});

	it('leaves later chunks without the placeholder unchanged', () => {
		expect(applyThemeToHtml('<main>Entry</main>', 'light')).toBe('<main>Entry</main>');
	});
});
