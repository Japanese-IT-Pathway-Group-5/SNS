import { describe, it, expect } from 'vitest';
import { parseBanner, MAX_BANNER_POINTS, MAX_BANNER_BYTES } from './banner';
const drawing = {
	version: 1,
	strokes: [
		{
			tool: 'pen',
			color: 'accent',
			size: 5,
			points: [
				[0, 0],
				[800, 320]
			]
		}
	]
};
describe('banner validation', () => {
	it('accepts bounded drawing strokes and rejects executable colors and out-of-range coordinates', () => {
		expect(parseBanner(JSON.stringify(drawing))).toEqual(drawing);
		for (const patch of [
			{ color: 'url(https://example.com)' },
			{ points: [[801, 0]] },
			{ size: 0 },
			{ tool: 'photo' },
			{ href: 'javascript:alert(1)' }
		]) {
			expect(
				parseBanner(JSON.stringify({ ...drawing, strokes: [{ ...drawing.strokes[0], ...patch }] }))
			).toBeNull();
		}
	});
	it('bounds the payload, total points and stroke count', () => {
		expect(parseBanner(' '.repeat(MAX_BANNER_BYTES + 1))).toBeNull();
		expect(
			parseBanner(
				JSON.stringify({
					version: 1,
					strokes: Array.from({ length: 121 }, () => drawing.strokes[0])
				})
			)
		).toBeNull();
		expect(
			parseBanner(
				JSON.stringify({
					version: 1,
					strokes: [
						{
							...drawing.strokes[0],
							points: Array.from({ length: MAX_BANNER_POINTS + 1 }, () => [0, 0])
						}
					]
				})
			)
		).toBeNull();
		expect(parseBanner('{bad json')).toBeNull();
	});
});
