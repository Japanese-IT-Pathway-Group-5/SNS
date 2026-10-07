export function serialize(value: unknown): unknown[] {
	const items: unknown[] = [];
	function add(value: unknown): number {
		const index = items.length;
		items.push(null);
		if (value instanceof Date) items[index] = ['Date', value.toISOString()];
		else if (Array.isArray(value)) items[index] = value.map(add);
		else if (value && typeof value === 'object') {
			items[index] = Object.fromEntries(
				Object.entries(value).map(([key, entry]) => [key, add(entry)])
			);
		} else items[index] = value;
		return index;
	}
	add(value);
	return items;
}
