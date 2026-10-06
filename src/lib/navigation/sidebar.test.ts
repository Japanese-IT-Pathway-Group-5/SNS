import { expect, it } from 'vitest';
import { parseSidebarPreference } from './sidebar';

it('reads expanded and collapsed preferences with bounded widths', () => {
	expect(parseSidebarPreference('expanded:304')).toEqual({ collapsed: false, width: 304 });
	expect(parseSidebarPreference('collapsed:192')).toEqual({ collapsed: true, width: 192 });
});

it('ignores missing, malformed and out-of-range preferences', () => {
	for (const value of [
		undefined,
		'',
		'expanded:191',
		'collapsed:321',
		'expanded:NaN',
		'expanded:240px',
		'other:240'
	]) {
		expect(parseSidebarPreference(value)).toBeNull();
	}
});
