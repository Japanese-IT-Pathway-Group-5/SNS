import { describe, expect, it } from 'vitest';
import { groupByDate } from './group-by-date';

const now = new Date('2026-10-03T12:00:00Z');
const options = { timeZone: 'UTC', locale: 'en-US', now };

describe('groupByDate', () => {
	it('returns no groups for an empty journal', () => {
		expect(groupByDate([], options)).toEqual([]);
	});

	it('groups entries by calendar day and keeps newest-first order', () => {
		const entries = [
			{ id: 'a', createdAt: new Date('2026-10-03T09:00:00Z') },
			{ id: 'b', createdAt: new Date('2026-10-03T01:00:00Z') },
			{ id: 'c', createdAt: new Date('2026-10-02T23:00:00Z') },
			{ id: 'd', createdAt: new Date('2026-10-01T08:00:00Z') }
		];

		const groups = groupByDate(entries, options);

		expect(groups.map((g) => [g.key, g.label, g.entries.map((e) => e.id)])).toEqual([
			['2026-10-03', 'Today', ['a', 'b']],
			['2026-10-02', 'Yesterday', ['c']],
			['2026-10-01', 'Thursday, October 1', ['d']]
		]);
	});

	it('adds the year for entries from another year', () => {
		const [group] = groupByDate([{ createdAt: '2025-12-31T10:00:00Z' }], options);

		expect(group?.label).toBe('Wednesday, December 31, 2025');
	});

	it("uses the reader's time zone to decide the day", () => {
		// 23:30 UTC on Oct 2 is already Oct 3 in Tokyo (UTC+9).
		const entry = { createdAt: new Date('2026-10-02T23:30:00Z') };

		expect(groupByDate([entry], options)[0]?.key).toBe('2026-10-02');
		expect(groupByDate([entry], { ...options, timeZone: 'Asia/Tokyo' })[0]?.key).toBe('2026-10-03');
	});

	it('accepts timestamps serialized as numbers or strings', () => {
		const groups = groupByDate(
			[{ createdAt: now.getTime() }, { createdAt: now.toISOString() }],
			options
		);

		expect(groups).toHaveLength(1);
		expect(groups[0]?.entries).toHaveLength(2);
	});
});
