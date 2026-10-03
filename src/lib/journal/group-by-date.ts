export interface DatedEntry {
	createdAt: Date | string | number;
}

export interface DateGroup<T extends DatedEntry> {
	/** Calendar day in the reader's time zone, e.g. "2026-10-03". */
	key: string;
	/** "Today", "Yesterday" or a full date such as "Thursday, October 1". */
	label: string;
	entries: T[];
}

interface GroupOptions {
	timeZone?: string;
	locale?: string;
	now?: Date;
}

function dayKey(date: Date, timeZone: string | undefined): string {
	// en-CA formats as YYYY-MM-DD, which sorts and compares cleanly.
	return new Intl.DateTimeFormat('en-CA', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).format(date);
}

/**
 * Groups entries (already sorted newest first) under calendar-day headings.
 * Order inside and between groups is preserved.
 */
export function groupByDate<T extends DatedEntry>(
	entries: T[],
	{ timeZone, locale, now = new Date() }: GroupOptions = {}
): DateGroup<T>[] {
	const today = dayKey(now, timeZone);
	const yesterday = dayKey(new Date(now.getTime() - 24 * 60 * 60 * 1000), timeZone);
	const currentYear = today.slice(0, 4);
	const groups: DateGroup<T>[] = [];

	for (const entry of entries) {
		const date = new Date(entry.createdAt);
		const key = dayKey(date, timeZone);
		let group = groups.at(-1);

		if (!group || group.key !== key) {
			const label =
				key === today
					? 'Today'
					: key === yesterday
						? 'Yesterday'
						: new Intl.DateTimeFormat(locale, {
								timeZone,
								weekday: 'long',
								month: 'long',
								day: 'numeric',
								...(key.slice(0, 4) === currentYear ? {} : { year: 'numeric' })
							}).format(date);

			group = { key, label, entries: [] };
			groups.push(group);
		}

		group.entries.push(entry);
	}

	return groups;
}
