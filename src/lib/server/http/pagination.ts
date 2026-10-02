export interface PaginationCursor {
	createdAt: number;
	id: string;
}

export interface PaginationParams {
	cursor?: PaginationCursor;
	limit?: number;
}

export class PaginationValidationError extends Error {}

export function parsePaginationParams(url: URL): PaginationParams {
	const cursorCreatedAt = url.searchParams.get('cursorCreatedAt');
	const cursorId = url.searchParams.get('cursorId');

	let cursor: PaginationCursor | undefined;

	if (cursorCreatedAt !== null || cursorId !== null) {
		const createdAt = Number(cursorCreatedAt);

		if (!Number.isFinite(createdAt) || !cursorId?.trim()) {
			throw new PaginationValidationError('Invalid cursor');
		}

		cursor = {
			createdAt,
			id: cursorId.trim()
		};
	}

	const limitParam = url.searchParams.get('limit');
	const limit = limitParam === null ? undefined : Number(limitParam);

	if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) {
		throw new PaginationValidationError('Invalid limit');
	}

	return {
		cursor,
		limit
	};
}
