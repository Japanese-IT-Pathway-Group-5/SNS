export interface PaginationCursor {
	createdAt: number;
	id: string;
}

export interface PaginationParams {
	cursor?: PaginationCursor;
	limit?: number;
}

export class PaginationValidationError extends Error {}

const MAX_CURSOR_TOKEN_LENGTH = 512;

function toBase64Url(text: string): string {
	const binary = Array.from(new TextEncoder().encode(text), (byte) =>
		String.fromCharCode(byte)
	).join('');

	return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function fromBase64Url(token: string): string {
	const binary = atob(token.replaceAll('-', '+').replaceAll('_', '/'));

	return new TextDecoder('utf-8', { fatal: true }).decode(
		Uint8Array.from(binary, (char) => char.charCodeAt(0))
	);
}

function validateCursor(createdAt: number, id: string): PaginationCursor {
	const trimmedId = id.trim();

	if (!Number.isSafeInteger(createdAt) || createdAt < 0 || !trimmedId) {
		throw new PaginationValidationError('Invalid cursor');
	}

	return { createdAt, id: trimmedId };
}

/** Encodes a (createdAt, id) position as an opaque, URL-safe token. */
export function encodeCursor(cursor: PaginationCursor): string {
	return toBase64Url(`${cursor.createdAt}:${cursor.id}`);
}

/** Decodes a token from encodeCursor; throws PaginationValidationError if it is malformed. */
export function decodeCursor(token: string): PaginationCursor {
	if (!token || token.length > MAX_CURSOR_TOKEN_LENGTH || !/^[A-Za-z0-9_-]+$/.test(token)) {
		throw new PaginationValidationError('Invalid cursor');
	}

	let raw: string;

	try {
		raw = fromBase64Url(token);
	} catch {
		throw new PaginationValidationError('Invalid cursor');
	}

	const separator = raw.indexOf(':');

	if (separator < 1 || !/^\d+$/.test(raw.slice(0, separator))) {
		throw new PaginationValidationError('Invalid cursor');
	}

	return validateCursor(Number(raw.slice(0, separator)), raw.slice(separator + 1));
}

/**
 * Reads `?cursor=<token>&limit=<n>`. The older `cursorCreatedAt` + `cursorId` pair is still
 * accepted so callers that have not moved to tokens (replies) keep working.
 */
export function parsePaginationParams(url: URL): PaginationParams {
	const cursorToken = url.searchParams.get('cursor');
	const cursorCreatedAt = url.searchParams.get('cursorCreatedAt');
	const cursorId = url.searchParams.get('cursorId');

	let cursor: PaginationCursor | undefined;

	if (cursorToken !== null) {
		cursor = decodeCursor(cursorToken);
	} else if (cursorCreatedAt !== null || cursorId !== null) {
		if (!cursorCreatedAt?.trim()) {
			throw new PaginationValidationError('Invalid cursor');
		}

		cursor = validateCursor(Number(cursorCreatedAt), cursorId ?? '');
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
